using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Net;
using System.Net.Mail;
using team_project.Data;
using team_project.Domain.Entities;
using team_project.Domain.Enums;
using team_project.DTOs.Invitations;
using team_project.Interfaces;

namespace TeamWorkload.Application.Services;

public class InvitationService : IInvitationService
{
    private readonly AppDbContext _db;
    private readonly UserManager<AppUser> _userManager;
    private readonly IConfiguration _config;

    public InvitationService(
        AppDbContext db,
        UserManager<AppUser> userManager,
        IConfiguration config)
    {
        _db = db;
        _userManager = userManager;
        _config = config;
    }

    // ─── Create & Send ────────────────────────────────────────────────────────

    public async Task<InvitationDto> CreateAsync(CreateInvitationRequest request, string invitedById)
    {
        var validRoles = new[] { "Admin", "TeamLeader", "Member" };
        if (!validRoles.Contains(request.Role))
            throw new ArgumentException($"Invalid role '{request.Role}'.");

        // Block duplicate pending invites to the same email
        var existing = await _db.Invitations
            .AnyAsync(i => i.Email == request.Email && i.Status == InvitationStatus.Pending);

        if (existing)
            throw new InvalidOperationException(
                $"A pending invitation for '{request.Email}' already exists.");

        // Block inviting an email that already has an account
        var alreadyUser = await _userManager.FindByEmailAsync(request.Email);
        if (alreadyUser != null)
            throw new InvalidOperationException(
                $"A user with email '{request.Email}' already exists.");

        var invitation = new Invitation
        {
            Email = request.Email,
            Role = request.Role,
            TeamId = request.TeamId,
            InvitedById = invitedById,
            Token = Guid.NewGuid().ToString(),
            Status = InvitationStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddHours(48)
        };

        _db.Invitations.Add(invitation);
        await _db.SaveChangesAsync();

        await SendInviteEmailAsync(invitation);

        return await MapToDtoAsync(invitation);
    }

    // ─── Get All ──────────────────────────────────────────────────────────────

    public async Task<IEnumerable<InvitationDto>> GetAllAsync()
    {
        // Auto-expire pending invitations past their ExpiresAt
        var expired = await _db.Invitations
            .Where(i => i.Status == InvitationStatus.Pending && i.ExpiresAt < DateTime.UtcNow)
            .ToListAsync();

        foreach (var inv in expired)
            inv.Status = InvitationStatus.Expired;

        if (expired.Any())
            await _db.SaveChangesAsync();

        var all = await _db.Invitations
            .Include(i => i.InvitedBy)
            .Include(i => i.Team)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();

        return all.Select(MapToDto);
    }

    // ─── Cancel ───────────────────────────────────────────────────────────────

    public async Task CancelAsync(int invitationId)
    {
        var invitation = await _db.Invitations.FindAsync(invitationId)
            ?? throw new KeyNotFoundException($"Invitation '{invitationId}' not found.");

        if (invitation.Status != InvitationStatus.Pending)
            throw new InvalidOperationException("Only pending invitations can be cancelled.");

        invitation.Status = InvitationStatus.Cancelled;
        await _db.SaveChangesAsync();
    }

    // ─── Validate Token (public) ──────────────────────────────────────────────

    public async Task<ValidateInvitationResponse> ValidateTokenAsync(string token)
    {
        var invitation = await _db.Invitations
            .FirstOrDefaultAsync(i => i.Token == token);

        if (invitation == null)
            return Invalid("Invitation not found.");

        if (invitation.Status == InvitationStatus.Accepted)
            return Invalid("This invitation has already been used.");

        if (invitation.Status == InvitationStatus.Cancelled)
            return Invalid("This invitation has been cancelled.");

        if (invitation.Status == InvitationStatus.Expired || invitation.ExpiresAt < DateTime.UtcNow)
        {
            invitation.Status = InvitationStatus.Expired;
            await _db.SaveChangesAsync();
            return Invalid("This invitation has expired.");
        }

        return new ValidateInvitationResponse
        {
            IsValid = true,
            Email = invitation.Email,
            Role = invitation.Role
        };
    }

    // ─── Accept (public) ──────────────────────────────────────────────────────

    public async Task AcceptAsync(AcceptInvitationRequest request)
    {
        var invitation = await _db.Invitations
            .FirstOrDefaultAsync(i => i.Token == request.Token)
            ?? throw new KeyNotFoundException("Invitation not found.");

        if (invitation.Status != InvitationStatus.Pending)
            throw new InvalidOperationException("This invitation is no longer valid.");

        if (invitation.ExpiresAt < DateTime.UtcNow)
        {
            invitation.Status = InvitationStatus.Expired;
            await _db.SaveChangesAsync();
            throw new InvalidOperationException("This invitation has expired.");
        }

        // Create the user
        var user = new AppUser
        {
            FullName = request.FullName,
            Email = invitation.Email,
            UserName = invitation.Email,
            TeamId = invitation.TeamId
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            var errors = string.Join("; ", result.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Failed to create user: {errors}");
        }

        await _userManager.AddToRoleAsync(user, invitation.Role);

        invitation.Status = InvitationStatus.Accepted;
        await _db.SaveChangesAsync();
    }

    // ─── Email ────────────────────────────────────────────────────────────────

    private async Task SendInviteEmailAsync(Invitation invitation)
    {
        var frontendUrl = _config["App:FrontendUrl"] ?? "http://localhost:5173";
        var link = $"{frontendUrl}/accept-invite?token={invitation.Token}";

        var smtpHost = _config["Email:SmtpHost"] ?? "smtp.gmail.com";
        var smtpPort = int.Parse(_config["Email:SmtpPort"] ?? "587");
        var senderEmail = _config["Email:SenderEmail"];
        var senderName = _config["Email:SenderName"];
        var password = _config["Email:Password"];

        var body = $"""
            <h2>You've been invited to Team Workload</h2>
            <p>You have been invited to join as a <strong>{invitation.Role}</strong>.</p>
            <p>Click the button below to accept the invitation and set up your account.</p>
            <p>
              <a href="{link}" style="
                display:inline-block;
                padding:10px 20px;
                background:#f59e0b;
                color:#fff;
                text-decoration:none;
                border-radius:6px;
                font-weight:bold;
              ">Accept Invitation</a>
            </p>
            <p>Or copy this link: {link}</p>
            <p style="color:#888;font-size:12px;">This invitation expires in 48 hours.</p>
            """;

        using var client = new SmtpClient(smtpHost, smtpPort)
        {
            EnableSsl = true,
            Credentials = new NetworkCredential(senderEmail, password)
        };

        var mail = new MailMessage
        {
            From = new MailAddress(senderEmail, senderName),
            Subject = "You've been invited to Team Workload",
            Body = body,
            IsBodyHtml = true
        };
        mail.To.Add(invitation.Email);


        await client.SendMailAsync(mail);
        Console.WriteLine($"EMAIL: {senderEmail}");
        Console.WriteLine($"PASSWORD LENGTH: {password?.Length}");
    }

    // ─── Mappers ──────────────────────────────────────────────────────────────

    private static ValidateInvitationResponse Invalid(string message) =>
        new() { IsValid = false, ErrorMessage = message };

    private async Task<InvitationDto> MapToDtoAsync(Invitation inv)
    {
        var inviter = await _userManager.FindByIdAsync(inv.InvitedById);
        return new InvitationDto
        {
            Id = inv.Id,
            Email = inv.Email,
            Role = inv.Role,
            TeamId = inv.TeamId,
            TeamName = inv.Team?.Name,
            Status = inv.Status.ToString(),
            InvitedByName = inviter?.FullName ?? inv.InvitedById,
            CreatedAt = inv.CreatedAt,
            ExpiresAt = inv.ExpiresAt
        };
    }

    private static InvitationDto MapToDto(Invitation inv) => new()
    {
        Id = inv.Id,
        Email = inv.Email,
        Role = inv.Role,
        TeamId = inv.TeamId,
        TeamName = inv.Team?.Name,
        Status = inv.Status.ToString(),
        InvitedByName = inv.InvitedBy?.FullName ?? inv.InvitedById,
        CreatedAt = inv.CreatedAt,
        ExpiresAt = inv.ExpiresAt
    };
}
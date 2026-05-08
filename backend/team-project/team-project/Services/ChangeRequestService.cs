using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using team_project.Data;
using team_project.Domain.Entities;
using team_project.Domain.Enums;
using team_project.DTOs.ChangeRequests;
using team_project.Interfaces;
using team_project.Repository;

namespace team_project.Services;

public class ChangeRequestService : IChangeRequestService
{
    private readonly ChangeRequestRepository _repo;
    private readonly AppDbContext _db;
    private readonly UserManager<AppUser> _userManager;

    public ChangeRequestService(
        ChangeRequestRepository repo,
        AppDbContext db,
        UserManager<AppUser> userManager)
    {
        _repo = repo;
        _db = db;
        _userManager = userManager;
    }

    // ─── Create ───────────────────────────────────────────────────────────────

    public async Task<ChangeRequestDto> CreateAsync(CreateChangeRequestDto dto, string requestedByUserId)
    {
        var task = await _db.WorkTasks
            .FirstOrDefaultAsync(t => t.Id == dto.TaskId)
            ?? throw new KeyNotFoundException($"Task '{dto.TaskId}' not found.");

        // Member can only raise requests for tasks assigned to them
        if (task.AssignedToId != requestedByUserId)
            throw new UnauthorizedAccessException(
                "You can only submit change requests for tasks assigned to you.");

        // Block duplicate pending requests of the same type on the same task
        var duplicatePending = await _db.ChangeRequests.AnyAsync(cr =>
            cr.WorkTaskId == dto.TaskId &&
            cr.Type == dto.Type &&
            cr.Status == ChangeRequestStatus.Pending);

        if (duplicatePending)
            throw new InvalidOperationException(
                $"A pending '{dto.Type}' request already exists for this task. " +
                "Wait for it to be reviewed before submitting another.");

        // Capture the current value so the leader can see old vs new
        var oldValue = dto.Type switch
        {
            ChangeRequestType.ChangeOwner => task.AssignedToId,
            ChangeRequestType.ChangeDueDate => task.DueDate.ToString("yyyy-MM-dd"),
            ChangeRequestType.IncreaseEffort => task.EstimatedEffortHours.ToString("F1"),
            _ => string.Empty
        };

        // Validate NewValue format per type
        ValidateNewValue(dto.Type, dto.NewValue);

        var entity = new ChangeRequest
        {
            WorkTaskId = dto.TaskId,
            RequestedById = requestedByUserId,
            Type = dto.Type,
            OldValue = oldValue,
            NewValue = dto.NewValue,
            Reason = dto.Reason,
            Status = ChangeRequestStatus.Pending,
            RequestedAt = DateTime.UtcNow
        };

        await _repo.AddAsync(entity);
        return await MapToDtoAsync(entity);
    }

    // ─── Approve ──────────────────────────────────────────────────────────────

    public async Task<ChangeRequestDto> ApproveAsync(int changeRequestId, string reviewedByUserId)
    {
        var cr = await _repo.GetByIdAsync(changeRequestId)
            ?? throw new KeyNotFoundException($"ChangeRequest '{changeRequestId}' not found.");

        if (cr.Status != ChangeRequestStatus.Pending)
            throw new InvalidOperationException(
                $"Cannot approve a request that is already '{cr.Status}'.");

        // Apply the change to the task
        var task = cr.WorkTask
            ?? await _db.WorkTasks.FindAsync(cr.WorkTaskId)
            ?? throw new KeyNotFoundException($"Task '{cr.WorkTaskId}' not found.");

        switch (cr.Type)
        {
            case ChangeRequestType.ChangeOwner:
                var newOwner = await _userManager.FindByIdAsync(cr.NewValue)
                    ?? throw new KeyNotFoundException(
                        $"New owner user '{cr.NewValue}' not found.");
                task.AssignedToId = cr.NewValue;
                break;

            case ChangeRequestType.ChangeDueDate:
                if (!DateTime.TryParse(cr.NewValue, out var newDate))
                    throw new InvalidOperationException(
                        $"Stored NewValue '{cr.NewValue}' is not a valid date.");
                task.DueDate = newDate;
                break;

            case ChangeRequestType.IncreaseEffort:
                if (!decimal.TryParse(cr.NewValue, out var newEffort))
                    throw new InvalidOperationException(
                        $"Stored NewValue '{cr.NewValue}' is not a valid number.");
                task.EstimatedEffortHours = newEffort;
                break;
        }

        cr.Status = ChangeRequestStatus.Approved;
        cr.ReviewedById = reviewedByUserId;
        cr.ReviewedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);

        await _repo.SaveAsync();
        return await MapToDtoAsync(cr);
    }

    // ─── Reject ───────────────────────────────────────────────────────────────

    public async Task<ChangeRequestDto> RejectAsync(
        int changeRequestId,
        string reviewedByUserId,
        string? rejectionNote)
    {
        var cr = await _repo.GetByIdAsync(changeRequestId)
            ?? throw new KeyNotFoundException($"ChangeRequest '{changeRequestId}' not found.");

        if (cr.Status != ChangeRequestStatus.Pending)
            throw new InvalidOperationException(
                $"Cannot reject a request that is already '{cr.Status}'.");

        cr.Status = ChangeRequestStatus.Rejected;
        cr.ReviewedById = reviewedByUserId;
        cr.ReviewedAt = DateTime.UtcNow;
        cr.RejectionNote = rejectionNote;

        await _repo.SaveAsync();
        return await MapToDtoAsync(cr);
    }

    // ─── Queries ──────────────────────────────────────────────────────────────

    public async Task<IEnumerable<ChangeRequestDto>> GetPendingAsync()
    {
        var list = await _repo.GetPendingAsync();
        var dtos = new List<ChangeRequestDto>();
        foreach (var item in list) dtos.Add(await MapToDtoAsync(item));
        return dtos;
    }

    public async Task<IEnumerable<ChangeRequestDto>> GetByTaskAsync(int taskId)
    {
        var list = await _repo.GetByTaskIdAsync(taskId);
        var dtos = new List<ChangeRequestDto>();
        foreach (var item in list) dtos.Add(await MapToDtoAsync(item));
        return dtos;
    }

    public async Task<IEnumerable<ChangeRequestDto>> GetAllAsync()
    {
        var list = await _repo.GetAllAsync();
        var dtos = new List<ChangeRequestDto>();
        foreach (var item in list) dtos.Add(await MapToDtoAsync(item));
        return dtos;
    }

    public async Task<IEnumerable<ChangeRequestDto>> GetByTaskForMemberAsync(int taskId, string memberId)
    {
        var list = await _repo.GetByTaskForMemberAsync(taskId, memberId);
        var dtos = new List<ChangeRequestDto>();
        foreach (var item in list) dtos.Add(await MapToDtoAsync(item));
        return dtos;
    }

    // ─── Validation ───────────────────────────────────────────────────────────

    private static void ValidateNewValue(ChangeRequestType type, string newValue)
    {
        switch (type)
        {
            case ChangeRequestType.ChangeDueDate:
                if (!DateTime.TryParse(newValue, out _))
                    throw new ArgumentException(
                        $"NewValue '{newValue}' is not a valid date for a ChangeDueDate request. " +
                        "Use format yyyy-MM-dd.");
                break;

            case ChangeRequestType.IncreaseEffort:
                if (!decimal.TryParse(newValue, out var effort) || effort <= 0)
                    throw new ArgumentException(
                        $"NewValue '{newValue}' must be a positive number for an IncreaseEffort request.");
                break;

            case ChangeRequestType.ChangeOwner:
                if (string.IsNullOrWhiteSpace(newValue))
                    throw new ArgumentException(
                        "NewValue must be the user ID of the new owner for a ChangeOwner request.");
                break;
        }
    }

    // ─── Mapper ───────────────────────────────────────────────────────────────

    private async Task<ChangeRequestDto> MapToDtoAsync(ChangeRequest cr)
    {
        var requester = await _userManager.FindByIdAsync(cr.RequestedById);

        AppUser? reviewer = null;
        if (cr.ReviewedById != null)
            reviewer = await _userManager.FindByIdAsync(cr.ReviewedById);

        return new ChangeRequestDto
        {
            Id = cr.Id,
            TaskId = cr.WorkTaskId,
            TaskTitle = cr.WorkTask?.Title ?? string.Empty,
            Type = cr.Type,
            OldValue = cr.OldValue,
            NewValue = cr.NewValue,
            Reason = cr.Reason,
            Status = cr.Status,
            RequestedById = cr.RequestedById,
            RequestedByName = requester?.FullName ?? cr.RequestedById,
            RequestedAt = cr.RequestedAt,
            ReviewedById = cr.ReviewedById,
            ReviewedByName = reviewer?.FullName,
            ReviewedAt = cr.ReviewedAt,
            RejectionNote = cr.RejectionNote
        };
    }
}
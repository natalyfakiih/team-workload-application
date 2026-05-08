using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using team_project.Application.DTOs.Tasks;
using team_project.Data;
using team_project.Domain.Entities;
using team_project.DTOs.Workload;
using team_project.Interfaces;

namespace TeamWorkload.Application.Services;

public class WorkloadService : IWorkloadService
{
    private readonly AppDbContext _db;
    private readonly UserManager<AppUser> _userManager;

    public WorkloadService(AppDbContext db, UserManager<AppUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    // ─── Summary: all members ─────────────────────────────────────────────────

    public async Task<WorkloadSummaryDto> GetSummaryAsync(WorkloadQuery query)
    {
        var (from, to) = query.Resolve();

        // Load all members (role = "Member")
        var members = await GetMemberUsersAsync();

        // Load all tasks that fall within the period once, then slice per member
        var allTasks = await LoadTasksInPeriodAsync(from, to);

        var memberDtos = members
            .Select(m => BuildMemberWorkload(m, allTasks, from, to, includeTasks: false))
            .OrderByDescending(m => m.TotalWeight)
            .ToList();

        return new WorkloadSummaryDto
        {
            PeriodFrom = from,
            PeriodTo = to,
            PeriodLabel = ResolvePeriodLabel(query, from, to),
            TotalMembers = memberDtos.Count,
            TotalTasks = memberDtos.Sum(m => m.TotalTasks),
            TotalEffortHours = memberDtos.Sum(m => m.TotalEffortHours),
            TotalWeight = memberDtos.Sum(m => m.TotalWeight),
            AvailableCount = memberDtos.Count(m => m.WorkloadStatus == "Available"),
            ModerateCount = memberDtos.Count(m => m.WorkloadStatus == "Moderate"),
            OverloadedCount = memberDtos.Count(m => m.WorkloadStatus == "Overloaded"),
            Members = memberDtos
        };
    }

    // ─── Detail: single member ────────────────────────────────────────────────

    public async Task<MemberWorkloadDto> GetMemberWorkloadAsync(string memberId, WorkloadQuery query)
    {
        var (from, to) = query.Resolve();

        var user = await _db.Users
            .Include(u => u.Team)
            .FirstOrDefaultAsync(u => u.Id == memberId)
            ?? throw new KeyNotFoundException($"Member '{memberId}' not found.");

        var tasks = await LoadTasksInPeriodAsync(from, to, memberId);

        return BuildMemberWorkload(user, tasks, from, to, includeTasks: true);
    }

    // ─── Core calculation ─────────────────────────────────────────────────────

    private MemberWorkloadDto BuildMemberWorkload(
        AppUser user,
        List<WorkTask> allTasks,
        DateTime from,
        DateTime to,
        bool includeTasks)
    {
        // A task "belongs" to this period if its DueDate falls within the range
        var memberTasks = allTasks
            .Where(t => t.AssignedToId == user.Id)
            .ToList();

        var totalEffort = memberTasks.Sum(t => t.EstimatedEffortHours);
        var totalWeight = memberTasks.Sum(t => t.Weight);

        var (status, color) = ResolveWorkloadStatus(totalWeight);

        return new MemberWorkloadDto
        {
            MemberId = user.Id,
            FullName = user.FullName,
            Email = user.Email ?? string.Empty,
            TeamId = user.TeamId,
            TeamName = user.Team?.Name,
            TotalTasks = memberTasks.Count,
            TotalEffortHours = totalEffort,
            TotalWeight = totalWeight,
            WorkloadStatus = status,
            StatusColor = color,
            PeriodFrom = from,
            PeriodTo = to,
            Tasks = includeTasks ? memberTasks.Select(MapToTaskDto).ToList() : new()
        };
    }

    // ─── Workload status thresholds (from spec) ───────────────────────────────

    private static (string Status, string Color) ResolveWorkloadStatus(decimal weight)
        => weight switch
        {
            <= 15 => ("Available", "green"),
            <= 25 => ("Moderate", "yellow"),
            _ => ("Overloaded", "red")
        };

    // ─── Data helpers ─────────────────────────────────────────────────────────

    /// <summary>
    /// Returns all users in the "Member" role, with their Team loaded.
    /// </summary>
    private async Task<List<AppUser>> GetMemberUsersAsync()
    {
        var memberIds = (await _userManager.GetUsersInRoleAsync("Member"))
            .Select(u => u.Id)
            .ToHashSet();

        return await _db.Users
            .Include(u => u.Team)
            .Where(u => memberIds.Contains(u.Id))
            .ToListAsync();
    }

    /// <summary>
    /// Loads tasks whose DueDate falls within [from, to].
    /// Optionally filtered to a single member.
    /// </summary>
    private async Task<List<WorkTask>> LoadTasksInPeriodAsync(
        DateTime from,
        DateTime to,
        string? memberId = null)
    {
        var query = _db.WorkTasks
            .Include(t => t.AssignedTo)
                .ThenInclude(u => u.Team)
            .Include(t => t.Acknowledgement)
            .Include(t => t.StatusHistory)
            .Where(t => t.DueDate.Date >= from && t.DueDate.Date <= to);

        if (memberId != null)
            query = query.Where(t => t.AssignedToId == memberId);

        return await query.ToListAsync();
    }

    // ─── Task → DTO mapper (lightweight, no history names lookup) ────────────

    private static TaskDto MapToTaskDto(WorkTask t) => new()
    {
        Id = t.Id,
        Title = t.Title,
        Description = t.Description,
        AssignedToId = t.AssignedToId,
        AssignedToName = t.AssignedTo?.FullName ?? string.Empty,
        Priority = t.Priority,
        Complexity = t.Complexity,
        Status = t.Status,
        EstimatedEffortHours = t.EstimatedEffortHours,
        Weight = t.Weight,
        ComplexityMultiplier = t.ComplexityMultiplier(),
        PriorityMultiplier = t.PriorityMultiplier(),
        StartDate = t.StartDate,
        DueDate = t.DueDate,
        IsAcknowledged = t.Acknowledgement != null,
        AcknowledgedAt = t.Acknowledgement?.AcknowledgedAt
    };

    // ─── Period label ─────────────────────────────────────────────────────────

    private static string ResolvePeriodLabel(WorkloadQuery query, DateTime from, DateTime to)
    {
        if (query.Week?.ToLower() == "current") return "Current Week";
        if (query.Week?.ToLower() == "next") return "Next Week";
        return $"{from:MMM dd} – {to:MMM dd, yyyy}";
    }
}
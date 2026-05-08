using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using team_project.Application.DTOs.Tasks;
using team_project.DTOs.Tasks;
using team_project.Data;
using team_project.Domain.Entities;
using team_project.Domain.Enums;
using team_project.Interfaces;

namespace team_project.Services;

public class TaskService : ITaskService
{
    private readonly AppDbContext _db;
    private readonly UserManager<AppUser> _userManager;

    public TaskService(AppDbContext db, UserManager<AppUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    // ─── Create ────────────────────────────────────────────────────────────────

    public async Task<TaskDto> CreateAsync(CreateTaskRequest request, string createdByUserId)
    {
        if (request.DueDate <= request.StartDate)
            throw new ArgumentException("DueDate must be after StartDate.");

        var assignee = await _userManager.FindByIdAsync(request.AssignedToId)
            ?? throw new KeyNotFoundException($"Member '{request.AssignedToId}' not found.");

        var task = new WorkTask
        {
            Title = request.Title,
            Description = request.Description,
            AssignedToId = request.AssignedToId,
            Priority = request.Priority,
            Complexity = request.Complexity,
            EstimatedEffortHours = request.EstimatedEffortHours,
            StartDate = request.StartDate,
            DueDate = request.DueDate,
            Status = Domain.Enums.WorkTaskStatus.New
        };

        _db.WorkTasks.Add(task);

        // Record initial status history entry
        var history = new TaskStatusHistory
        {
            WorkTask = task,
            OldStatus = team_project.Domain.Enums.WorkTaskStatus.New,
            NewStatus = team_project.Domain.Enums.WorkTaskStatus.New,
            ChangedById = createdByUserId,
            ChangedAt = DateTime.UtcNow
        };
        _db.TaskStatusHistories.Add(history);

        await _db.SaveChangesAsync();
        return await MapToDtoAsync(task);
    }

    // ─── Update (Leader only — guards for restricted fields) ──────────────────

    public async Task<TaskDto> UpdateAsync(int taskId, UpdateTaskRequest request, string requestingUserId)
    {
        var task = await GetTaskOrThrowAsync(taskId);

        // Guard: changing owner requires approved ChangeRequest
        if (request.AssignedToId != null && request.AssignedToId != task.AssignedToId)
        {
            var approved = await HasApprovedChangeRequestAsync(taskId, ChangeRequestType.ChangeOwner);
            if (!approved)
                throw new InvalidOperationException(
                    "Changing task owner requires an approved ChangeRequest of type 'ChangeOwner'.");

            var newOwner = await _userManager.FindByIdAsync(request.AssignedToId)
                ?? throw new KeyNotFoundException($"Member '{request.AssignedToId}' not found.");

            task.AssignedToId = request.AssignedToId;
        }

        // Guard: changing due date requires approved ChangeRequest
        if (request.DueDate.HasValue && request.DueDate.Value != task.DueDate)
        {
            var approved = await HasApprovedChangeRequestAsync(taskId, ChangeRequestType.ChangeDueDate);
            if (!approved)
                throw new InvalidOperationException(
                    "Changing the due date requires an approved ChangeRequest of type 'ChangeDueDate'.");

            task.DueDate = request.DueDate.Value;
        }

        // Guard: increasing effort requires approved ChangeRequest
        if (request.EstimatedEffortHours.HasValue && request.EstimatedEffortHours.Value > task.EstimatedEffortHours)
        {
            var approved = await HasApprovedChangeRequestAsync(taskId, ChangeRequestType.IncreaseEffort);
            if (!approved)
                throw new InvalidOperationException(
                    "Increasing estimated effort requires an approved ChangeRequest of type 'IncreaseEffort'.");

            task.EstimatedEffortHours = request.EstimatedEffortHours.Value;
        }
        else if (request.EstimatedEffortHours.HasValue)
        {
            // Decreasing effort is allowed freely
            task.EstimatedEffortHours = request.EstimatedEffortHours.Value;
        }

        // Free fields — no approval needed
        if (request.Title != null) task.Title = request.Title;
        if (request.Description != null) task.Description = request.Description;
        if (request.Priority != null) task.Priority = request.Priority.Value;
        if (request.Complexity != null) task.Complexity = request.Complexity.Value;
        if (request.StartDate != null) task.StartDate = request.StartDate.Value;

        await _db.SaveChangesAsync();
        return await MapToDtoAsync(task);
    }

    // ─── Delete ──────────────────────────────────────────────────────────────────────────────

    public async Task DeleteAsync(int taskId)
    {
        var task = await _db.WorkTasks
            .Include(t => t.StatusHistory)
            .Include(t => t.Acknowledgement)
            .FirstOrDefaultAsync(t => t.Id == taskId)
            ?? throw new KeyNotFoundException($"Task '{taskId}' not found.");

        _db.WorkTasks.Remove(task);
        await _db.SaveChangesAsync();
    }

    // ─── Status update (Member) ────────────────────────────────────────────────

    public async Task<TaskDto> UpdateStatusAsync(int taskId, UpdateTaskStatusRequest request, string memberId)
    {
        var task = await GetTaskOrThrowAsync(taskId);

        if (task.AssignedToId != memberId)
            throw new UnauthorizedAccessException("You can only update status on tasks assigned to you.");

        var oldStatus = task.Status;
        task.Status = request.NewStatus;

        _db.TaskStatusHistories.Add(new TaskStatusHistory
        {
            WorkTaskId = taskId,
            OldStatus = oldStatus,
            NewStatus = request.NewStatus,
            ChangedById = memberId,
            ChangedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        return await MapToDtoAsync(task);
    }

    // ─── Acknowledge (Member) ─────────────────────────────────────────────────

    public async Task AcknowledgeAsync(int taskId, string memberId)
    {
        var task = await GetTaskOrThrowAsync(taskId);

        if (task.AssignedToId != memberId)
            throw new UnauthorizedAccessException("You can only acknowledge tasks assigned to you.");

        var alreadyAcknowledged = await _db.TaskAcknowledgements
            .AnyAsync(a => a.WorkTaskId == taskId);

        if (alreadyAcknowledged)
            throw new InvalidOperationException("Task has already been acknowledged.");

        _db.TaskAcknowledgements.Add(new TaskAcknowledgement
        {
            WorkTaskId = taskId,
            AcknowledgedById = memberId,
            AcknowledgedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
    }

    // ─── Queries ──────────────────────────────────────────────────────────────

    public async Task<TaskDto> GetByIdAsync(int taskId)
    {
        var task = await GetTaskOrThrowAsync(taskId);
        return await MapToDtoAsync(task);
    }

    public async Task<IEnumerable<TaskDto>> GetAllAsync()
    {
        var tasks = await _db.WorkTasks
            .Include(t => t.AssignedTo)
            .Include(t => t.StatusHistory)
            .Include(t => t.Acknowledgement)
            .ToListAsync();

        var dtos = new List<TaskDto>();
        foreach (var t in tasks) dtos.Add(await MapToDtoAsync(t));
        return dtos;
    }

    public async Task<IEnumerable<TaskDto>> GetByMemberAsync(string memberId)
    {
        var tasks = await _db.WorkTasks
            .Include(t => t.AssignedTo)
            .Include(t => t.StatusHistory)
            .Include(t => t.Acknowledgement)
            .Where(t => t.AssignedToId == memberId)
            .ToListAsync();

        var dtos = new List<TaskDto>();
        foreach (var t in tasks) dtos.Add(await MapToDtoAsync(t));
        return dtos;
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private async Task<WorkTask> GetTaskOrThrowAsync(int taskId)
    {
        return await _db.WorkTasks
            .Include(t => t.AssignedTo)
            .Include(t => t.StatusHistory)
                .ThenInclude(h => h.ChangedBy)
            .Include(t => t.Acknowledgement)
            .FirstOrDefaultAsync(t => t.Id == taskId)
            ?? throw new KeyNotFoundException($"Task '{taskId}' not found.");
    }

    private async Task<bool> HasApprovedChangeRequestAsync(int taskId, ChangeRequestType type)
    {
        return await _db.ChangeRequests.AnyAsync(cr =>
            cr.WorkTaskId == taskId &&
            cr.Type == type &&
            cr.Status == ChangeRequestStatus.Approved);
    }

    private async Task<TaskDto> MapToDtoAsync(WorkTask task)
    {
        // Resolve ChangedBy names for history
        var historyDtos = new List<TaskStatusHistoryDto>();
        if (task.StatusHistory != null)
        {
            foreach (var h in task.StatusHistory.OrderBy(h => h.ChangedAt))
            {
                var changer = await _userManager.FindByIdAsync(h.ChangedById);
                historyDtos.Add(new TaskStatusHistoryDto
                {
                    OldStatus = h.OldStatus.ToString(),
                    NewStatus = h.NewStatus.ToString(),
                    ChangedBy = changer?.FullName ?? h.ChangedById,
                    ChangedAt = h.ChangedAt
                });
            }
        }

        return new TaskDto
        {
            Id = task.Id,
            Title = task.Title,
            Description = task.Description,
            AssignedToId = task.AssignedToId,
            AssignedToName = task.AssignedTo?.FullName ?? string.Empty,
            Priority = task.Priority,
            Complexity = task.Complexity,
            Status = task.Status,
            EstimatedEffortHours = task.EstimatedEffortHours,
            Weight = task.Weight,
            ComplexityMultiplier = task.ComplexityMultiplier(),
            PriorityMultiplier = task.PriorityMultiplier(),
            StartDate = task.StartDate,
            DueDate = task.DueDate,
            IsAcknowledged = task.Acknowledgement != null,
            AcknowledgedAt = task.Acknowledgement?.AcknowledgedAt,
            StatusHistory = historyDtos
        };
    }
}
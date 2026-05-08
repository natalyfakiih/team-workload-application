using team_project.Domain.Enums;

namespace team_project.Application.DTOs.Tasks;

public class TaskDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    // Assigned member
    public string AssignedToId { get; set; } = string.Empty;
    public string AssignedToName { get; set; } = string.Empty;

    // Enums
    public Priority Priority { get; set; }
    public string PriorityLabel => Priority.ToString();

    public Complexity Complexity { get; set; }
    public string ComplexityLabel => Complexity.ToString();

    public WorkTaskStatus Status { get; set; }
    public string StatusLabel => Status.ToString();

    // Effort & weight
    public decimal EstimatedEffortHours { get; set; }
    public decimal Weight { get; set; }

    // Weight breakdown (for detail screen)
    public decimal ComplexityMultiplier { get; set; }
    public decimal PriorityMultiplier { get; set; }

    // Dates
    public DateTime StartDate { get; set; }
    public DateTime DueDate { get; set; }

    // Acknowledgement
    public bool IsAcknowledged { get; set; }
    public DateTime? AcknowledgedAt { get; set; }

    // Audit
    public List<TaskStatusHistoryDto> StatusHistory { get; set; } = new();
}

public class TaskStatusHistoryDto
{
    public string OldStatus { get; set; } = string.Empty;
    public string NewStatus { get; set; } = string.Empty;
    public string ChangedBy { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; }
}
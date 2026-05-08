using team_project.Domain.Enums;

namespace team_project.DTOs.ChangeRequests
{
    public class ChangeRequestDto
    {
        public int Id { get; set; }

        // Task context
        public int TaskId { get; set; }
        public string TaskTitle { get; set; } = string.Empty;

        // What is being requested
        public ChangeRequestType Type { get; set; }
        public string TypeLabel => Type.ToString();
        public string OldValue { get; set; } = string.Empty;
        public string NewValue { get; set; } = string.Empty;
        public string? Reason { get; set; }

        // Status
        public ChangeRequestStatus Status { get; set; }
        public string StatusLabel => Status.ToString();

        // Who requested it
        public string RequestedById { get; set; } = string.Empty;
        public string RequestedByName { get; set; } = string.Empty;
        public DateTime RequestedAt { get; set; }

        // Who reviewed it (null if still pending)
        public string? ReviewedById { get; set; }
        public string? ReviewedByName { get; set; }
        public DateTime? ReviewedAt { get; set; }

        // Optional rejection note from the leader
        public string? RejectionNote { get; set; }
    }
}

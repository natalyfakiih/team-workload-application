using team_project.Domain.Enums;

namespace team_project.Domain.Entities
{
    public class ChangeRequest
    {
        public int Id { get; set; }
        public int WorkTaskId { get; set; }
        public WorkTask WorkTask { get; set; }
        public string RequestedById { get; set; }
        public ChangeRequestType Type { get; set; }
        public string OldValue { get; set; }
        public string NewValue { get; set; }
        public ChangeRequestStatus Status { get; set; }
        public string Reason { get; set; }
        public DateTime RequestedAt { get; set; }
        public DateTime? ReviewedAt { get; set; }
        public string? ReviewedById { get; set; }
        public string? RejectionNote { get; set; }
    }
}

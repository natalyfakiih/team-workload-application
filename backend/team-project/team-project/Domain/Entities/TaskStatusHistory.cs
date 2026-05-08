namespace team_project.Domain.Entities
{
    public class TaskStatusHistory
    {
        public int Id { get; set; }
        public int WorkTaskId { get; set; }
        public WorkTask WorkTask { get; set; }
        // Use the domain WorkTaskStatus enum for status values
        public team_project.Domain.Enums.WorkTaskStatus OldStatus { get; set; }
        public team_project.Domain.Enums.WorkTaskStatus NewStatus { get; set; }
        public string ChangedById { get; set; }
        // Navigation to the user who made the change
        public AppUser ChangedBy { get; set; }
        public DateTime ChangedAt { get; set; } = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
    }
}

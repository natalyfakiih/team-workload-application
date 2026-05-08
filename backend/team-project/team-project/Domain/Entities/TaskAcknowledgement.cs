namespace team_project.Domain.Entities
{
    public class TaskAcknowledgement
    {
        public int Id { get; set; }
        public int WorkTaskId { get; set; }
        public WorkTask WorkTask { get; set; }
        public string AcknowledgedById { get; set; }
        public DateTime AcknowledgedAt { get; set; }
    }
}

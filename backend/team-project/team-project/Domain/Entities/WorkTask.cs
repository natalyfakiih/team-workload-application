using team_project.Domain.Enums;

namespace team_project.Domain.Entities
{
    public class WorkTask
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string AssignedToId { get; set; }
        public AppUser AssignedTo { get; set; }
        public Priority Priority { get; set; }
        public Complexity Complexity { get; set; } 
        public decimal EstimatedEffortHours { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime DueDate { get; set; }
        public WorkTaskStatus Status { get; set; }

        // Calculated — not stored in DB, computed on read
        public decimal Weight =>
            EstimatedEffortHours
            * ComplexityMultiplier()
            * PriorityMultiplier();

        public decimal ComplexityMultiplier() => Complexity switch
        {
            Complexity.Simple => 1.0m,
            Complexity.Medium => 1.5m,
            Complexity.Complex => 2.0m,
            _ => 1.0m
        };
        public decimal PriorityMultiplier() => Priority switch
        {
            Priority.Low => 1.0m,
            Priority.Medium => 1.2m,
            Priority.High => 1.5m,
            Priority.Critical => 2.0m,
            _ => 1.0m
        };

        public ICollection<TaskStatusHistory> StatusHistory { get; set; }
        public TaskAcknowledgement Acknowledgement { get; set; }
    }
}

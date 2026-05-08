using System.ComponentModel.DataAnnotations;
using team_project.Domain.Enums;

namespace team_project.DTOs.Tasks
{
    public class CreateTaskRequest
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        [Required]
        public string AssignedToId { get; set; } = string.Empty;

        [Required]
        public Priority Priority { get; set; }

        [Required]
        public Complexity Complexity { get; set; }

        [Range(0.5, 200)]
        public decimal EstimatedEffortHours { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime DueDate { get; set; }
    }
}

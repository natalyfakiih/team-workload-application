using System.ComponentModel.DataAnnotations;
using team_project.Domain.Enums;

namespace team_project.DTOs.Tasks
{
    public class UpdateTaskRequest
    {
        [MaxLength(200)]
        public string? Title { get; set; }

        public string? Description { get; set; }

        /// <summary>
        /// Changing owner requires an approved ChangeRequest — validated in service layer.
        /// </summary>
        public string? AssignedToId { get; set; }

        public Priority? Priority { get; set; }

        public Complexity? Complexity { get; set; }

        /// <summary>
        /// Increasing effort requires an approved ChangeRequest — validated in service layer.
        /// </summary>
        [Range(0.5, 200)]
        public decimal? EstimatedEffortHours { get; set; }

        public DateTime? StartDate { get; set; }

        /// <summary>
        /// Changing due date requires an approved ChangeRequest — validated in service layer.
        /// </summary>
        public DateTime? DueDate { get; set; }
    }
}

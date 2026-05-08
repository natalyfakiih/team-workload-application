using System.ComponentModel.DataAnnotations;
using team_project.Domain.Enums;

namespace team_project.DTOs.ChangeRequests
{
    public class CreateChangeRequestDto
    {
        [Required]
        public int TaskId { get; set; }

        [Required]
        public ChangeRequestType Type { get; set; }

        /// <summary>
        /// The new value being requested as a string.
        /// - ChangeOwner      → new assignee user ID
        /// - ChangeDueDate    → new date in "yyyy-MM-dd" format
        /// - IncreaseEffort   → new effort in hours e.g. "12.5"
        /// </summary>
        [Required]
        [MaxLength(500)]
        public string NewValue { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Reason { get; set; }
    }
}

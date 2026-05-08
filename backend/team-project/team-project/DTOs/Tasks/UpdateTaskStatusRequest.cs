using System.ComponentModel.DataAnnotations;
using team_project.Domain.Enums;

namespace team_project.DTOs.Tasks
{
    public class UpdateTaskStatusRequest 
    {
        [Required]
        public WorkTaskStatus NewStatus { get; set; }
    }
}

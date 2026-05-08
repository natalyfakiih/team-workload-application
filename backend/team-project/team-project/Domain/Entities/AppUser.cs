using Microsoft.AspNetCore.Identity;

namespace team_project.Domain.Entities
{
    public class AppUser : IdentityUser
    {
        public string FullName { get; set; }
        public int? TeamId { get; set; }
        public Team Team { get; set; }
        public ICollection<WorkTask> AssignedTasks { get; set; }
    }
}

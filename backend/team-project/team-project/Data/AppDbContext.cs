using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using team_project.Domain.Entities;

namespace team_project.Data
{
    public class AppDbContext : IdentityDbContext<AppUser, AppRole, string>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Team> Teams { get; set; }
        public DbSet<WorkTask> WorkTasks { get; set; }
        public DbSet<TaskStatusHistory> TaskStatusHistories { get; set; }
        public DbSet<TaskAcknowledgement> TaskAcknowledgements { get; set; }
        public DbSet<ChangeRequest> ChangeRequests { get; set; }
        public DbSet<Invitation> Invitations { get; set; } 
    }
}

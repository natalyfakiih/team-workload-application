using team_project.Domain.Enums;

namespace team_project.Domain.Entities
{
    public class Invitation
    {
        public int Id { get; set; }

        public string Email { get; set; } = string.Empty;

        /// <summary>Role to assign when the invite is accepted: Admin | TeamLeader | Member</summary>
        public string Role { get; set; } = string.Empty;

        public int? TeamId { get; set; }
        public Team? Team { get; set; }

        /// <summary>Unique GUID token sent in the invite email link.</summary>
        public string Token { get; set; } = Guid.NewGuid().ToString();

        public InvitationStatus Status { get; set; } = InvitationStatus.Pending;

        public string InvitedById { get; set; } = string.Empty;
        public AppUser InvitedBy { get; set; } = null!;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>Invites expire after 48 hours by default.</summary>
        public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddHours(48);
    }
}

using System.ComponentModel.DataAnnotations;

namespace team_project.DTOs.Invitations
{
    public class CreateInvitationRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Role { get; set; } = string.Empty; // Admin | TeamLeader | Member

        public int? TeamId { get; set; }
    }
}

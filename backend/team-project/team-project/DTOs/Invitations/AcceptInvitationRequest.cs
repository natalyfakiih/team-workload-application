using System.ComponentModel.DataAnnotations;

namespace team_project.DTOs.Invitations
{
    public class AcceptInvitationRequest
    {
        [Required]
        public string Token { get; set; } = string.Empty;

        [Required]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;
    }
}

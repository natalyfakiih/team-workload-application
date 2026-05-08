namespace team_project.DTOs.Invitations
{
    public class ValidateInvitationResponse
    {
        public bool IsValid { get; set; }
        public string? Email { get; set; }
        public string? Role { get; set; }
        public string? ErrorMessage { get; set; }
    }
}

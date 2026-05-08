using team_project.DTOs.Invitations;

namespace team_project.Interfaces
{
    public interface IInvitationService
    {
        /// <summary>Admin creates and sends an invitation email.</summary>
        Task<InvitationDto> CreateAsync(CreateInvitationRequest request, string invitedById);

        /// <summary>Admin views all invitations.</summary>
        Task<IEnumerable<InvitationDto>> GetAllAsync();

        /// <summary>Admin cancels a pending invitation.</summary>
        Task CancelAsync(int invitationId);

        /// <summary>Public — validates a token before showing the register form.</summary>
        Task<ValidateInvitationResponse> ValidateTokenAsync(string token);

        /// <summary>Public — registers the user using the invite token.</summary>
        Task AcceptAsync(AcceptInvitationRequest request);
    }

}

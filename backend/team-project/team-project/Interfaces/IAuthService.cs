using team_project.DTOs.Auth;

namespace team_project.Interfaces
{
    public interface IAuthService
    {
        Task<LoginResponse> LoginAsync(LoginRequest request);
    }

}

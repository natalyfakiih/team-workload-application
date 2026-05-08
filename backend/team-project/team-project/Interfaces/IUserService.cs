using team_project.DTOs.Users;

namespace team_project.Interfaces
{
    public interface IUserService
    {
        Task<UserDto> CreateUserAsync(CreateUserRequest request);
        Task<UserDto> GetByIdAsync(string id);
        Task<IEnumerable<UserDto>> GetAllAsync();
        Task AssignRoleAsync(string userId, string role);
        Task AssignTeamAsync(string userId, int teamId);
    }
}

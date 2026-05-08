using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using team_project.Data;
using team_project.Domain.Entities;
using team_project.DTOs.Users;
using team_project.Interfaces;

namespace team_project.Services
{
    public class UserService : IUserService
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly AppDbContext _db;

        public UserService(UserManager<AppUser> userManager, AppDbContext db)
        {
            _userManager = userManager;
            _db = db;
        }

        public async Task<UserDto> CreateUserAsync(CreateUserRequest request)
        {
            // Validate role
            var validRoles = new[] { "Admin", "TeamLeader", "Member" };
            if (!validRoles.Contains(request.Role))
                throw new ArgumentException($"Invalid role '{request.Role}'. Must be one of: {string.Join(", ", validRoles)}");

            // Validate team if provided
            if (request.TeamId.HasValue)
            {
                var teamExists = await _db.Teams.AnyAsync(t => t.Id == request.TeamId.Value);
                if (!teamExists)
                    throw new ArgumentException($"Team with ID {request.TeamId} does not exist.");
            }

            var user = new AppUser
            {
                FullName = request.FullName,
                Email = request.Email,
                UserName = request.Email,
                TeamId = request.TeamId
            };

            var result = await _userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
            {
                var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"Failed to create user: {errors}");
            }

            await _userManager.AddToRoleAsync(user, request.Role);

            return await MapToDtoAsync(user);
        }

        public async Task<UserDto> GetByIdAsync(string id)
        {
            var user = await _db.Users
                .Include(u => u.Team)
                .FirstOrDefaultAsync(u => u.Id == id)
                ?? throw new KeyNotFoundException($"User '{id}' not found.");

            return await MapToDtoAsync(user);
        }

        public async Task<IEnumerable<UserDto>> GetAllAsync()
        {
            var users = await _db.Users
                .Include(u => u.Team)
                .ToListAsync();

            var dtos = new List<UserDto>();
            foreach (var user in users)
                dtos.Add(await MapToDtoAsync(user));

            return dtos;
        }

        public async Task AssignRoleAsync(string userId, string role)
        {
            var user = await _userManager.FindByIdAsync(userId)
                ?? throw new KeyNotFoundException($"User '{userId}' not found.");

            var currentRoles = await _userManager.GetRolesAsync(user);
            if (currentRoles.Any())
                await _userManager.RemoveFromRolesAsync(user, currentRoles);

            await _userManager.AddToRoleAsync(user, role);
        }

        public async Task AssignTeamAsync(string userId, int teamId)
        {
            var user = await _userManager.FindByIdAsync(userId)
                ?? throw new KeyNotFoundException($"User '{userId}' not found.");

            var teamExists = await _db.Teams.AnyAsync(t => t.Id == teamId);
            if (!teamExists)
                throw new KeyNotFoundException($"Team '{teamId}' not found.");

            user.TeamId = teamId;
            await _userManager.UpdateAsync(user);
        }

        private async Task<UserDto> MapToDtoAsync(AppUser user)
        {
            var roles = await _userManager.GetRolesAsync(user);
            return new UserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email!,
                Role = roles.FirstOrDefault() ?? "Member",
                TeamId = user.TeamId,
                TeamName = user.Team?.Name
            };
        }
    }
}

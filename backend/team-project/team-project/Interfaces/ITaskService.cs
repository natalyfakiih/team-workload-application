using team_project.Application.DTOs.Tasks;
using team_project.DTOs.Tasks;

namespace team_project.Interfaces
{
    public interface ITaskService
    {
        Task<TaskDto> CreateAsync(CreateTaskRequest request, string createdByUserId);
        Task<TaskDto> UpdateAsync(int taskId, UpdateTaskRequest request, string requestingUserId);
        Task<TaskDto> UpdateStatusAsync(int taskId, UpdateTaskStatusRequest request, string memberId);
        Task AcknowledgeAsync(int taskId, string memberId);
        Task DeleteAsync(int taskId);
        Task<TaskDto> GetByIdAsync(int taskId);
        Task<IEnumerable<TaskDto>> GetAllAsync();
        Task<IEnumerable<TaskDto>> GetByMemberAsync(string memberId);
    }
}
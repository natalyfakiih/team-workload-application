using team_project.DTOs.ChangeRequests;

namespace team_project.Interfaces
{
    public interface IChangeRequestService
    {
        /// <summary>Member submits a change request for one of their tasks.</summary>
        Task<ChangeRequestDto> CreateAsync(CreateChangeRequestDto dto, string requestedByUserId);

        /// <summary>Leader approves a pending request — task is updated immediately.</summary>
        Task<ChangeRequestDto> ApproveAsync(int changeRequestId, string reviewedByUserId);

        /// <summary>Leader rejects a pending request with an optional note.</summary>
        Task<ChangeRequestDto> RejectAsync(int changeRequestId, string reviewedByUserId, string? rejectionNote);

        /// <summary>All requests still in Pending status — shown in the leader's review queue.</summary>
        Task<IEnumerable<ChangeRequestDto>> GetAllAsync();

        Task<IEnumerable<ChangeRequestDto>> GetPendingAsync();

        /// <summary>All requests for a specific task (for the task detail screen).</summary>
        Task<IEnumerable<ChangeRequestDto>> GetByTaskAsync(int taskId);

        Task<IEnumerable<ChangeRequestDto>> GetByTaskForMemberAsync(int taskId, string memberId);
    }

}
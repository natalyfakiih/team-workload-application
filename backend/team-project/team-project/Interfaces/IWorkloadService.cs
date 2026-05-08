using team_project.DTOs.Workload;

namespace team_project.Interfaces
{
    public interface IWorkloadService
    {
        /// <summary>
        /// Returns workload summary for all members for the resolved period.
        /// </summary>
        Task<WorkloadSummaryDto> GetSummaryAsync(WorkloadQuery query);

        /// <summary>
        /// Returns detailed workload (including task list) for a single member.
        /// </summary>
        Task<MemberWorkloadDto> GetMemberWorkloadAsync(string memberId, WorkloadQuery query);
    }
}

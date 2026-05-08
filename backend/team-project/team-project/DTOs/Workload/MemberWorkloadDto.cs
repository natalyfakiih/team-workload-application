using team_project.Application.DTOs.Tasks;

namespace team_project.DTOs.Workload
{
    public class MemberWorkloadDto
    {
        // Member info
        public string MemberId { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public int? TeamId { get; set; }
        public string? TeamName { get; set; }

        // Workload totals for the selected period
        public int TotalTasks { get; set; }
        public decimal TotalEffortHours { get; set; }
        public decimal TotalWeight { get; set; }

        // Traffic-light status derived from TotalWeight
        // "Available" (0–15) | "Moderate" (16–25) | "Overloaded" (26+)
        public string WorkloadStatus { get; set; } = string.Empty;

        // Color for the UI indicator: "green" | "yellow" | "red"
        public string StatusColor { get; set; } = string.Empty;

        // Date range this summary covers
        public DateTime PeriodFrom { get; set; }
        public DateTime PeriodTo { get; set; }

        // Task breakdown — populated when drilling into a specific member
        public List<TaskDto> Tasks { get; set; } = new();
    }
}

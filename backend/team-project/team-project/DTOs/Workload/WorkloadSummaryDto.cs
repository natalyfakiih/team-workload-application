namespace team_project.DTOs.Workload
{
    public class WorkloadSummaryDto
    {
        // The period this summary covers
        public DateTime PeriodFrom { get; set; }
        public DateTime PeriodTo { get; set; }
        public string PeriodLabel { get; set; } = string.Empty; // e.g. "Current Week", "Next Week", "Custom"

        // Team-wide totals
        public int TotalMembers { get; set; }
        public int TotalTasks { get; set; }
        public decimal TotalEffortHours { get; set; }
        public decimal TotalWeight { get; set; }

        // Breakdown counts by status
        public int AvailableCount { get; set; }   // weight 0–15  (green)
        public int ModerateCount { get; set; }    // weight 16–25 (yellow)
        public int OverloadedCount { get; set; }  // weight 26+   (red)

        // Per-member rows for the dashboard table
        public List<MemberWorkloadDto> Members { get; set; } = new();
    }
}

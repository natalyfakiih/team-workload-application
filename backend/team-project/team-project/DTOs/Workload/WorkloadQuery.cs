namespace team_project.DTOs.Workload
{
    public class WorkloadQuery
    {
        /// <summary>
        /// Preset week selector: "current" | "next"
        /// If provided, From/To are ignored.
        /// </summary>
        public string? Week { get; set; }

        /// <summary>
        /// Custom range start (inclusive). Used when Week is null.
        /// </summary>
        public DateTime? From { get; set; }

        /// <summary>
        /// Custom range end (inclusive). Used when Week is null.
        /// </summary>
        public DateTime? To { get; set; }

        /// <summary>
        /// Resolves the date range from this query.
        /// Throws if neither Week nor From+To are supplied.
        /// </summary>
        public (DateTime From, DateTime To) Resolve()
        {
            if (Week?.ToLower() == "current")
            {
                var today = DateTime.UtcNow.Date;
                var monday = today.AddDays(-(int)today.DayOfWeek + (int)DayOfWeek.Monday);
                if (today.DayOfWeek == DayOfWeek.Sunday)
                    monday = today.AddDays(-6);
                return (monday, monday.AddDays(6));
            }

            if (Week?.ToLower() == "next")
            {
                var today = DateTime.UtcNow.Date;
                var monday = today.AddDays(-(int)today.DayOfWeek + (int)DayOfWeek.Monday);
                if (today.DayOfWeek == DayOfWeek.Sunday)
                    monday = today.AddDays(-6);
                var nextMonday = monday.AddDays(7);
                return (nextMonday, nextMonday.AddDays(6));
            }

            if (From.HasValue && To.HasValue)
            {
                if (To.Value < From.Value)
                    throw new ArgumentException("'to' date must be on or after 'from' date.");
                return (From.Value.Date, To.Value.Date);
            }

            throw new ArgumentException(
                "Provide either 'week=current', 'week=next', or both 'from' and 'to' query parameters.");
        }
    }
}

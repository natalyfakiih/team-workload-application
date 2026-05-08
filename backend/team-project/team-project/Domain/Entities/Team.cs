namespace team_project.Domain.Entities
{
    public class Team
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public ICollection<AppUser> Members { get; set; }
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using team_project.Data;
using team_project.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace team_project.Controllers;

[ApiController]
[Route("api/teams")]
[Authorize(Roles = "Admin")]
public class TeamsController : ControllerBase
{
    private readonly AppDbContext _db;

    public TeamsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var teams = await _db.Teams
            .Include(t => t.Members)
            .Select(t => new {
                t.Id,
                t.Name,
                memberCount = t.Members.Count
            })
            .ToListAsync();
        return Ok(teams);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] TeamRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { message = "Team name is required." });

        var exists = await _db.Teams.AnyAsync(t => t.Name == request.Name);
        if (exists)
            return BadRequest(new { message = $"Team '{request.Name}' already exists." });

        var team = new Team { Name = request.Name };
        _db.Teams.Add(team);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = team.Id }, new { team.Id, team.Name, memberCount = 0 });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Rename(int id, [FromBody] TeamRequest request)
    {
        var team = await _db.Teams.FindAsync(id);
        if (team == null) return NotFound(new { message = "Team not found." });

        team.Name = request.Name;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var team = await _db.Teams.Include(t => t.Members).FirstOrDefaultAsync(t => t.Id == id);
        if (team == null) return NotFound(new { message = "Team not found." });

        if (team.Members.Any())
            return BadRequest(new { message = "Cannot delete a team that still has members. Reassign members first." });

        _db.Teams.Remove(team);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public class TeamRequest
{
    public string Name { get; set; } = string.Empty;
}
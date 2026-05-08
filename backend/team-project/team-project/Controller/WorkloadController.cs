using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using team_project.DTOs.Workload;
using team_project.Interfaces;

namespace TeamWorkload.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "TeamLeader,Admin")]
public class WorkloadController : ControllerBase
{
    private readonly IWorkloadService _workloadService;

    public WorkloadController(IWorkloadService workloadService)
    {
        _workloadService = workloadService;
    }

    /// <summary>
    /// Get workload summary for all members.
    ///
    /// Usage:
    ///   GET /api/workload?week=current
    ///   GET /api/workload?week=next
    ///   GET /api/workload?from=2025-06-01&amp;to=2025-06-07
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(WorkloadSummaryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetSummary(
        [FromQuery] string? week,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        try
        {
            var query = new WorkloadQuery { Week = week, From = from, To = to };
            var summary = await _workloadService.GetSummaryAsync(query);
            return Ok(summary);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get detailed workload (including task list) for a single member.
    ///
    /// Usage:
    ///   GET /api/workload/members/{id}?week=current
    ///   GET /api/workload/members/{id}?from=2025-06-01&amp;to=2025-06-07
    /// </summary>
    [HttpGet("members/{memberId}")]
    [ProducesResponseType(typeof(MemberWorkloadDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMemberWorkload(
        string memberId,
        [FromQuery] string? week,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        try
        {
            var query = new WorkloadQuery { Week = week, From = from, To = to };
            var result = await _workloadService.GetMemberWorkloadAsync(memberId, query);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
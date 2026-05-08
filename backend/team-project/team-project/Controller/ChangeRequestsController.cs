using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using team_project.DTOs.ChangeRequests;
using team_project.Interfaces;

namespace team_project.Controllers;

[ApiController]
[Route("api/change-requests")]
[Authorize]
public class ChangeRequestsController : ControllerBase
{
    private readonly IChangeRequestService _service;

    public ChangeRequestsController(IChangeRequestService service)
    {
        _service = service;
    }

    /// <summary>
    /// Get all change requests - full history (TeamLeader, Admin).
    /// GET /api/change-requests  [TeamLeader, Admin]
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "TeamLeader,Admin")]
    [ProducesResponseType(typeof(IEnumerable<ChangeRequestDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var list = await _service.GetAllAsync();
        return Ok(list);
    }

    /// <summary>
    /// Get all pending change requests (leader's review queue).
    /// GET /api/change-requests/pending  [TeamLeader, Admin]
    /// </summary>
    [HttpGet("pending")]
    [Authorize(Roles = "TeamLeader,Admin")]
    [ProducesResponseType(typeof(IEnumerable<ChangeRequestDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPending()
    {
        var list = await _service.GetPendingAsync();
        return Ok(list);
    }

    /// <summary>
    /// Get all change requests for a specific task (task detail screen).
    /// GET /api/change-requests/task/{taskId}  [TeamLeader, Admin]
    /// </summary>
    [HttpGet("task/{taskId:int}")]
    [Authorize(Roles = "TeamLeader,Admin")]
    [ProducesResponseType(typeof(IEnumerable<ChangeRequestDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByTask(int taskId)
    {
        var list = await _service.GetByTaskAsync(taskId);
        return Ok(list);
    }

    /// <summary>
    /// Member fetches their own change requests for a specific task.
    /// GET /api/change-requests/my-task/{taskId}  [Member]
    /// </summary>
    [HttpGet("my-task/{taskId:int}")]
    [Authorize(Roles = "Member")]
    [ProducesResponseType(typeof(IEnumerable<ChangeRequestDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyTaskRequests(int taskId)
    {
        var memberId = GetCurrentUserId();
        var list = await _service.GetByTaskForMemberAsync(taskId, memberId);
        return Ok(list);
    }

    /// <summary>
    /// Member submits a change request for one of their assigned tasks.
    /// POST /api/change-requests  [Member]
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Member")]
    [ProducesResponseType(typeof(ChangeRequestDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Create([FromBody] CreateChangeRequestDto dto)
    {
        try
        {
            var memberId = GetCurrentUserId();
            var result = await _service.CreateAsync(dto, memberId);
            return CreatedAtAction(nameof(GetPending), new { }, result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Leader approves a pending request — task is updated immediately.
    /// PUT /api/change-requests/{id}/approve  [TeamLeader, Admin]
    /// </summary>
    [HttpPut("{id:int}/approve")]
    [Authorize(Roles = "TeamLeader,Admin")]
    [ProducesResponseType(typeof(ChangeRequestDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Approve(int id)
    {
        try
        {
            var leaderId = GetCurrentUserId();
            var result = await _service.ApproveAsync(id, leaderId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Leader rejects a pending request with an optional note.
    /// PUT /api/change-requests/{id}/reject  [TeamLeader, Admin]
    /// </summary>
    [HttpPut("{id:int}/reject")]
    [Authorize(Roles = "TeamLeader,Admin")]
    [ProducesResponseType(typeof(ChangeRequestDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Reject(int id, [FromBody] RejectChangeRequestBody body)
    {
        try
        {
            var leaderId = GetCurrentUserId();
            var result = await _service.RejectAsync(id, leaderId, body.RejectionNote);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    private string GetCurrentUserId()
        => User.FindFirstValue(ClaimTypes.NameIdentifier)
           ?? throw new UnauthorizedAccessException("User ID not found in token.");
}

/// <summary>Request body for the reject endpoint.</summary>
public class RejectChangeRequestBody
{
    public string? RejectionNote { get; set; }
}
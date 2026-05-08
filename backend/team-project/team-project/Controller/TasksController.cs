using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using team_project.Application.DTOs.Tasks;
using team_project.DTOs.Tasks;
using team_project.Interfaces;

namespace TeamWorkload.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly ITaskService _taskService;

    public TasksController(ITaskService taskService)
    {
        _taskService = taskService;
    }

    /// <summary>
    /// Get all tasks. (TeamLeader)
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "TeamLeader,Admin")]
    [ProducesResponseType(typeof(IEnumerable<TaskDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var tasks = await _taskService.GetAllAsync();
        return Ok(tasks);
    }

    /// <summary>
    /// Get a single task by ID. (TeamLeader, Member)
    /// </summary>
    [HttpGet("{id:int}")]
    [Authorize(Roles = "TeamLeader,Admin,Member")]
    [ProducesResponseType(typeof(TaskDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        try
        {
            var task = await _taskService.GetByIdAsync(id);
            return Ok(task);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get all tasks assigned to a specific member. (TeamLeader, Admin)
    /// </summary>
    [HttpGet("member/{memberId}")]
    [Authorize(Roles = "TeamLeader,Admin")]
    [ProducesResponseType(typeof(IEnumerable<TaskDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByMember(string memberId)
    {
        var tasks = await _taskService.GetByMemberAsync(memberId);
        return Ok(tasks);
    }

    /// <summary>
    /// Get tasks assigned to the currently logged-in member. (Member)
    /// </summary>
    [HttpGet("my")]
    [Authorize(Roles = "Member")]
    [ProducesResponseType(typeof(IEnumerable<TaskDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyTasks()
    {
        var memberId = GetCurrentUserId();
        var tasks = await _taskService.GetByMemberAsync(memberId);
        return Ok(tasks);
    }

    /// <summary>
    /// Create a new task and assign it to a member. (TeamLeader)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "TeamLeader")]
    [ProducesResponseType(typeof(TaskDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateTaskRequest request)
    {
        try
        {
            var leaderId = GetCurrentUserId();
            var task = await _taskService.CreateAsync(request, leaderId);
            return CreatedAtAction(nameof(GetById), new { id = task.Id }, task);
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

    /// <summary>
    /// Update task fields. Restricted fields (owner, due date, effort increase)
    /// require an approved ChangeRequest first. (TeamLeader)
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "TeamLeader")]
    [ProducesResponseType(typeof(TaskDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateTaskRequest request)
    {
        try
        {
            var leaderId = GetCurrentUserId();
            var task = await _taskService.UpdateAsync(id, request, leaderId);
            return Ok(task);
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
    /// Update the status of a task assigned to the logged-in member. (Member)
    /// </summary>
    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = "Member")]
    [ProducesResponseType(typeof(TaskDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateTaskStatusRequest request)
    {
        try
        {
            var memberId = GetCurrentUserId();
            var task = await _taskService.UpdateStatusAsync(id, request, memberId);
            return Ok(task);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
    }

    /// <summary>
    /// Acknowledge a task assigned to the logged-in member. (Member)
    /// </summary>
    [HttpPost("{id:int}/acknowledge")]
    [Authorize(Roles = "Member")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Acknowledge(int id)
    {
        try
        {
            var memberId = GetCurrentUserId();
            await _taskService.AcknowledgeAsync(id, memberId);
            return NoContent();
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
    }

    /// <summary>
    /// Delete a task. (TeamLeader, Admin)
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "TeamLeader,Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _taskService.DeleteAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    private string GetCurrentUserId()
        => User.FindFirstValue(ClaimTypes.NameIdentifier)
           ?? throw new UnauthorizedAccessException("User ID not found in token.");
}
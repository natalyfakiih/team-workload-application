using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using team_project.DTOs.Invitations;
using team_project.Interfaces;

namespace TeamWorkload.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InvitationsController : ControllerBase
{
    private readonly IInvitationService _service;

    public InvitationsController(IInvitationService service)
    {
        _service = service;
    }

    /// <summary>
    /// Admin sends an invitation email to a new user.
    /// POST /api/invitations  [Admin]
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(InvitationDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateInvitationRequest request)
    {
        try
        {
            var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? throw new UnauthorizedAccessException();

            var dto = await _service.CreateAsync(request, adminId);
            return CreatedAtAction(nameof(GetAll), new { }, dto);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Admin lists all invitations.
    /// GET /api/invitations  [Admin]
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(IEnumerable<InvitationDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var list = await _service.GetAllAsync();
        return Ok(list);
    }

    /// <summary>
    /// Admin cancels a pending invitation.
    /// DELETE /api/invitations/{id}  [Admin]
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Cancel(int id)
    {
        try
        {
            await _service.CancelAsync(id);
            return NoContent();
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
    /// Public — validate a token before showing the register form.
    /// GET /api/invitations/validate?token=xxx
    /// </summary>
    [HttpGet("validate")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ValidateInvitationResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Validate([FromQuery] string token)
    {
        if (string.IsNullOrWhiteSpace(token))
            return BadRequest(new { message = "Token is required." });

        var result = await _service.ValidateTokenAsync(token);
        return Ok(result);
    }

    /// <summary>
    /// Public — accept the invitation and register.
    /// POST /api/invitations/accept
    /// </summary>
    [HttpPost("accept")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Accept([FromBody] AcceptInvitationRequest request)
    {
        try
        {
            await _service.AcceptAsync(request);
            return NoContent();
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
}
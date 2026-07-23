using System;
using System.Collections.Generic;
using System.Security;
using System.Security.Claims;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using NatureMiniPlex.Core.Application.Features.Users.Commands;
using NatureMiniPlex.Core.Application.Features.Users.Queries;
using NatureMiniPlex.Infrastructure.Authentication;

using Microsoft.AspNetCore.Authorization;

namespace NatureMiniPlex.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IMediator _mediator;

    public UsersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [HasPermission("users:manage")]
    public async Task<IActionResult> GetUsers()
    {
        return Ok(await _mediator.Send(new GetUsersQuery()));
    }

    /// <summary>
    /// Fetch logged-in user profile. Available to any authenticated user.
    /// </summary>
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (!int.TryParse(currentUserIdClaim, out int currentUserId))
        {
            return Unauthorized("User identity not found.");
        }

        var user = await _mediator.Send(new GetUserByIdQuery(currentUserId));
        return Ok(user);
    }

    /// <summary>
    /// Update logged-in user profile details (e.g. Email). Available to any authenticated user.
    /// </summary>
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateOwnProfile([FromBody] UpdateUserProfileDto dto)
    {
        var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (!int.TryParse(currentUserIdClaim, out int currentUserId))
        {
            return Unauthorized("User identity not found.");
        }

        var success = await _mediator.Send(new UpdateUserProfileCommand(currentUserId, dto.Email, null, null));
        return Ok(new { Message = "Profile updated successfully.", Success = success });
    }

    [HttpGet("{id}")]
    [HasPermission("users:manage")]
    public async Task<IActionResult> GetUser(int id)
    {
        return Ok(await _mediator.Send(new GetUserByIdQuery(id)));
    }

    [HttpPost]
    [HasPermission("users:manage")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserCommand command)
    {
        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetUser), new { id = result }, result);
    }

    /// <summary>
    /// Update User Role assignments with Anti-Privilege Escalation check.
    /// </summary>
    [HttpPut("{id}/roles")]
    [HasPermission("roles:manage")]
    public async Task<IActionResult> UpdateUserRoles(int id, [FromBody] List<int> roleIds)
    {
        var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (int.TryParse(currentUserIdClaim, out int currentUserId) && currentUserId == id)
        {
            throw new SecurityException("Anti-Privilege Escalation Safeguard: Users are strictly forbidden from modifying their own roles.");
        }

        var success = await _mediator.Send(new UpdateUserRolesCommand(id, roleIds));
        return Ok(new { Message = $"Roles successfully updated for user ID {id}.", Success = success });
    }

    /// <summary>
    /// Update User Details (Email, CinemaId scope, IsActive status).
    /// </summary>
    [HttpPut("{id}")]
    [HasPermission("users:manage")]
    public async Task<IActionResult> UpdateUserProfile(int id, [FromBody] UpdateUserProfileDto dto)
    {
        var success = await _mediator.Send(new UpdateUserProfileCommand(id, dto.Email, dto.CinemaId, dto.IsActive));
        return Ok(new { Message = $"User Profile successfully updated for user ID {id}.", Success = success });
    }

    /// <summary>
    /// Quick status toggle (Active / Disabled).
    /// </summary>
    [HttpPut("{id}/status")]
    [HasPermission("users:manage")]
    public async Task<IActionResult> UpdateUserStatus(int id, [FromBody] UpdateUserStatusDto dto)
    {
        var success = await _mediator.Send(new UpdateUserStatusCommand(id, dto.IsActive));
        return Ok(new { Message = $"User status updated to {(dto.IsActive ? "Active" : "Disabled")} for user ID {id}.", Success = success });
    }

    /// <summary>
    /// Change password endpoint for logged-in staff user. Available to any authenticated user.
    /// </summary>
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (!int.TryParse(currentUserIdClaim, out int currentUserId))
        {
            return Unauthorized("User identity not found.");
        }

        var success = await _mediator.Send(new ChangePasswordCommand(currentUserId, dto.CurrentPassword, dto.NewPassword));
        return Ok(new { Message = "Password successfully changed.", Success = success });
    }
}

public class UpdateUserProfileDto
{
    public string? Email { get; set; }
    public int? CinemaId { get; set; }
    public bool? IsActive { get; set; }
}

public class UpdateUserStatusDto
{
    public bool IsActive { get; set; }
}

public class ChangePasswordDto
{
    public string CurrentPassword { get; set; } = null!;
    public string NewPassword { get; set; } = null!;
}


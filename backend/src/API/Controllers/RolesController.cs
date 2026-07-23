using System.Collections.Generic;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using NatureMiniPlex.Core.Application.Features.Roles.Commands;
using NatureMiniPlex.Core.Application.Features.Roles.Queries;
using NatureMiniPlex.Infrastructure.Authentication;

namespace NatureMiniPlex.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[HasPermission("roles:manage")]
public class RolesController : ControllerBase
{
    private readonly IMediator _mediator;

    public RolesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetRoles()
    {
        return Ok(await _mediator.Send(new GetRolesQuery()));
    }

    [HttpGet("permissions")]
    public async Task<IActionResult> GetPermissions()
    {
        return Ok(await _mediator.Send(new GetPermissionsQuery()));
    }

    [HttpPut("{id}/permissions")]
    public async Task<IActionResult> UpdateRolePermissions(int id, [FromBody] List<int> permissionIds)
    {
        var success = await _mediator.Send(new UpdateRolePermissionsCommand(id, permissionIds));
        return Ok(new { Message = $"Permissions successfully updated for role ID {id}.", Success = success });
    }
}

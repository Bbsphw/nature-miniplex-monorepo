using MediatR;
using Microsoft.AspNetCore.Mvc;
using NatureMiniPlex.Core.Application.Features.Users.Queries;
using NatureMiniPlex.Core.Application.Features.Users.Commands;
using System.Threading.Tasks;

namespace NatureMiniPlex.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Microsoft.AspNetCore.Authorization.Authorize(Roles = "Owner")]
public class UsersController : ControllerBase
{
    private readonly IMediator _mediator;

    public UsersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetUsers()
    {
        return Ok(await _mediator.Send(new GetUsersQuery()));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetUser(int id)
    {
        return Ok(await _mediator.Send(new GetUserByIdQuery(id)));
    }

    [HttpPost]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserCommand command)
    {
        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetUser), new { id = result }, result);
    }
}

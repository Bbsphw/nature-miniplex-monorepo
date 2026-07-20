using MediatR;
using Microsoft.AspNetCore.Mvc;
using NatureMiniPlex.Core.Application.Features.Auth.Commands;
using NatureMiniPlex.Core.Application.DTOs.Auth;
using System.Threading.Tasks;

namespace NatureMiniPlex.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("login")]
    public async Task<IActionResult> SignIn([FromBody] SignInRequestDto request)
    {
        var response = await _mediator.Send(new SignInCommand(request));
        return Ok(response);
    }
}

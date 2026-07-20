using MediatR;
using Microsoft.AspNetCore.Mvc;
using NatureMiniPlex.Core.Application.Features.ActionLogs.Queries;
using System.Threading.Tasks;

namespace NatureMiniPlex.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Microsoft.AspNetCore.Authorization.Authorize(Roles = "Owner")]
public class ActionLogsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ActionLogsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetActionLogs()
    {
        return Ok(await _mediator.Send(new GetActionLogsQuery()));
    }
}

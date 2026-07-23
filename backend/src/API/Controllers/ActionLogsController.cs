using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using NatureMiniPlex.Core.Application.Features.ActionLogs.Queries;
using NatureMiniPlex.Infrastructure.Authentication;

namespace NatureMiniPlex.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[HasPermission("users:manage")]
public class ActionLogsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ActionLogsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetActionLogs([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        return Ok(await _mediator.Send(new GetActionLogsQuery(page, pageSize)));
    }
}

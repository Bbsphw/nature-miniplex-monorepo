using MediatR;
using Microsoft.AspNetCore.Mvc;
using NatureMiniPlex.Core.Application.Features.Reports.Queries;
using System;
using System.Threading.Tasks;

namespace NatureMiniPlex.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Microsoft.AspNetCore.Authorization.Authorize(Roles = "Owner")]
public class ReportsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ReportsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("daily-revenue")]
    public async Task<IActionResult> GetDailyRevenue([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
    {
        return Ok(await _mediator.Send(new GetDailyRevenueQuery(startDate, endDate)));
    }
}

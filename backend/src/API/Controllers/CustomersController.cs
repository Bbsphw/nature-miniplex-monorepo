using MediatR;
using Microsoft.AspNetCore.Mvc;
using NatureMiniPlex.Core.Application.Features.Customers.Queries;
using System.Threading.Tasks;

namespace NatureMiniPlex.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly IMediator _mediator;

    public CustomersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetCustomers()
    {
        return Ok(await _mediator.Send(new GetCustomersQuery()));
    }
}

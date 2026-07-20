using MediatR;
using Microsoft.AspNetCore.Mvc;
using NatureMiniPlex.Core.Application.Features.Cinemas.Queries.GetCinemas;


namespace NatureMiniPlex.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CinemasController : ControllerBase
{
    private readonly IMediator _mediator;

    public CinemasController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetCinemas()
    {
        var result = await _mediator.Send(new GetCinemasQuery());
        return Ok(result);
    }


}

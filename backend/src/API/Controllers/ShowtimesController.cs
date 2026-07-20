using MediatR;
using Microsoft.AspNetCore.Mvc;
using NatureMiniPlex.Core.Application.Features.Showtimes.Commands.CreateShowtime;
using NatureMiniPlex.Core.Application.Features.Showtimes.Commands.LockShowtime;

namespace NatureMiniPlex.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ShowtimesController : ControllerBase
{
    private readonly IMediator _mediator;

    public ShowtimesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetShowtimes([FromQuery] int? movieId, [FromQuery] int? cinemaId, [FromQuery] DateTime? date, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _mediator.Send(new NatureMiniPlex.Core.Application.Features.Showtimes.Queries.GetShowtimes.GetShowtimesQuery(movieId, cinemaId, date, pageNumber, pageSize));
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetShowtime(int id)
    {
        var result = await _mediator.Send(new NatureMiniPlex.Core.Application.Features.Showtimes.Queries.GetShowtimeById.GetShowtimeByIdQuery(id));
        return Ok(result);
    }

    [HttpGet("{id}/seats")]
    public async Task<IActionResult> GetShowtimeSeats(int id)
    {
        var result = await _mediator.Send(new NatureMiniPlex.Core.Application.Features.Showtimes.Queries.GetShowtimeSeats.GetShowtimeSeatsQuery(id));
        return Ok(result);
    }

    [HttpPost]
    [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Owner")]
    public async Task<IActionResult> CreateShowtime([FromBody] CreateShowtimeCommand command)
    {
        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetShowtime), new { id = result }, result);
    }

    [HttpPut("{id}")]
    [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Owner")]
    public async Task<IActionResult> UpdateShowtime(int id, [FromBody] NatureMiniPlex.Core.Application.Features.Showtimes.Commands.UpdateShowtime.UpdateShowtimeCommand command)
    {
        if (id != command.Id) return BadRequest("ID mismatch");
        await _mediator.Send(command);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Owner")]
    public async Task<IActionResult> DeleteShowtime(int id)
    {
        await _mediator.Send(new NatureMiniPlex.Core.Application.Features.Showtimes.Commands.DeleteShowtime.DeleteShowtimeCommand(id));
        return NoContent();
    }

    [HttpPatch("{id}/lock")]
    [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Owner")]
    public async Task<IActionResult> LockShowtime(int id)
    {
        var result = await _mediator.Send(new LockShowtimeCommand(id));
        return Ok(result);
    }
}

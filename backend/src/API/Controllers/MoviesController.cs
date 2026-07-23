using MediatR;
using Microsoft.AspNetCore.Mvc;
using NatureMiniPlex.Core.Application.Features.Movies.Commands.CreateMovie;
using NatureMiniPlex.Core.Application.Features.Movies.Queries.GetMovies;
using NatureMiniPlex.Infrastructure.Authentication;

namespace NatureMiniPlex.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MoviesController : ControllerBase
{
    private readonly IMediator _mediator;

    public MoviesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetMovies([FromQuery] bool onlyActive = true)
    {
        var result = await _mediator.Send(new GetMoviesQuery(onlyActive));
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetMovie(int id)
    {
        var result = await _mediator.Send(new NatureMiniPlex.Core.Application.Features.Movies.Queries.GetMovieById.GetMovieByIdQuery(id));
        return Ok(result);
    }

    [HttpPost]
    [HasPermission("showtime:create")]
    public async Task<IActionResult> CreateMovie([FromBody] CreateMovieCommand command)
    {
        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetMovie), new { id = result }, result);
    }

    [HttpPut("{id}")]
    [HasPermission("showtime:create")]
    public async Task<IActionResult> UpdateMovie(int id, [FromBody] NatureMiniPlex.Core.Application.Features.Movies.Commands.UpdateMovie.UpdateMovieCommand command)
    {
        if (id != command.Id) return BadRequest("ID mismatch");
        await _mediator.Send(command);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [HasPermission("showtime:create")]
    public async Task<IActionResult> DeleteMovie(int id)
    {
        await _mediator.Send(new NatureMiniPlex.Core.Application.Features.Movies.Commands.DeleteMovie.DeleteMovieCommand(id));
        return NoContent();
    }
}

using MediatR;
using Microsoft.AspNetCore.Mvc;
using NatureMiniPlex.Core.Application.Features.Bookings.Commands.CreateBooking;
using NatureMiniPlex.Core.Application.Features.Bookings.Commands.CancelBooking;

namespace NatureMiniPlex.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BookingsController : ControllerBase
{
    private readonly IMediator _mediator;

    public BookingsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Owner")]
    public async Task<IActionResult> GetBookings([FromQuery] string? phoneNumber, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _mediator.Send(new NatureMiniPlex.Core.Application.Features.Bookings.Queries.GetBookings.GetBookingsQuery(phoneNumber, pageNumber, pageSize));
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetBooking(Guid id)
    {
        var result = await _mediator.Send(new NatureMiniPlex.Core.Application.Features.Bookings.Queries.GetBookingById.GetBookingByIdQuery(id));
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateBooking([FromBody] CreateBookingCommand command)
    {
        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetBooking), new { id = result }, result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> CancelBooking(Guid id, [FromQuery] string phoneNumber)
    {
        var result = await _mediator.Send(new CancelBookingCommand(id, phoneNumber));
        return Ok(result);
    }

    [HttpDelete("{id}/items/{itemId}")]
    public async Task<IActionResult> CancelBookingItem(Guid id, Guid itemId, [FromQuery] string phoneNumber)
    {
        var result = await _mediator.Send(new NatureMiniPlex.Core.Application.Features.Bookings.Commands.CancelBookingItem.CancelBookingItemCommand(id, itemId, phoneNumber));
        return Ok(result);
    }

    [HttpPost("cancel-seat")]
    public async Task<IActionResult> CancelBookingBySeat([FromBody] NatureMiniPlex.Core.Application.Features.Bookings.Commands.CancelBookingBySeat.CancelBookingBySeatCommand command)
    {
        var result = await _mediator.Send(command);
        return Ok(result);
    }
}

using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using NatureMiniPlex.Core.Application.Interfaces.Repositories;
using NatureMiniPlex.Core.Domain.Entities;

namespace NatureMiniPlex.Core.Application.Features.Bookings.Queries.GetBookings;

public record GetBookingsQuery(string? PhoneNumber) : IRequest<IReadOnlyList<Booking>>;

public class GetBookingsQueryHandler : IRequestHandler<GetBookingsQuery, IReadOnlyList<Booking>>
{
    private readonly IBookingRepository _bookingRepository;

    public GetBookingsQueryHandler(IBookingRepository bookingRepository)
    {
        _bookingRepository = bookingRepository;
    }

    public async Task<IReadOnlyList<Booking>> Handle(GetBookingsQuery request, CancellationToken cancellationToken)
    {
        var bookings = await _bookingRepository.GetAllAsync(cancellationToken);
        
        if (!string.IsNullOrEmpty(request.PhoneNumber))
        {
            bookings = bookings.Where(b => b.Customer != null && b.Customer.PhoneNumber == request.PhoneNumber).ToList();
        }

        return bookings.ToList();
    }
}

using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using NatureMiniPlex.Core.Application.Interfaces.Repositories;
using NatureMiniPlex.Core.Domain.Entities;

namespace NatureMiniPlex.Core.Application.Features.Bookings.Queries.GetBookings;

public record GetBookingsQuery(string? PhoneNumber, int PageNumber = 1, int PageSize = 20) : IRequest<IReadOnlyList<NatureMiniPlex.Core.Application.DTOs.BookingDto>>;

public class GetBookingsQueryHandler : IRequestHandler<GetBookingsQuery, IReadOnlyList<NatureMiniPlex.Core.Application.DTOs.BookingDto>>
{
    private readonly IBookingRepository _bookingRepository;

    public GetBookingsQueryHandler(IBookingRepository bookingRepository)
    {
        _bookingRepository = bookingRepository;
    }

    public async Task<IReadOnlyList<NatureMiniPlex.Core.Application.DTOs.BookingDto>> Handle(GetBookingsQuery request, CancellationToken cancellationToken)
    {
        return await _bookingRepository.GetPagedBookingsAsync(request.PhoneNumber, request.PageNumber, request.PageSize, cancellationToken);
    }
}

using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using NatureMiniPlex.Core.Application.Interfaces.Repositories;

namespace NatureMiniPlex.Core.Application.Features.Bookings.Queries.GetBookingById;

public record GetBookingByIdQuery(Guid Id) : IRequest<NatureMiniPlex.Core.Domain.Entities.Booking?>;

public class GetBookingByIdQueryHandler : IRequestHandler<GetBookingByIdQuery, NatureMiniPlex.Core.Domain.Entities.Booking?>
{
    private readonly IBookingRepository _bookingRepository;

    public GetBookingByIdQueryHandler(IBookingRepository bookingRepository)
    {
        _bookingRepository = bookingRepository;
    }

    public async Task<NatureMiniPlex.Core.Domain.Entities.Booking?> Handle(GetBookingByIdQuery request, CancellationToken cancellationToken)
    {
        return await _bookingRepository.GetBookingWithItemsAsync(request.Id, cancellationToken);
    }
}

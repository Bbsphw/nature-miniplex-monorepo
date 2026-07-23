using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using NatureMiniPlex.Core.Application.Interfaces.Repositories;

namespace NatureMiniPlex.Core.Application.Features.Reports.Queries;

public record DailyRevenueDto(DateTime Date, decimal Revenue);

public record GetDailyRevenueQuery(DateTime StartDate, DateTime EndDate) : IRequest<List<DailyRevenueDto>>;

public class GetDailyRevenueQueryHandler : IRequestHandler<GetDailyRevenueQuery, List<DailyRevenueDto>>
{
    private readonly IBookingRepository _bookingRepository;

    public GetDailyRevenueQueryHandler(IBookingRepository bookingRepository)
    {
        _bookingRepository = bookingRepository;
    }

    public async Task<List<DailyRevenueDto>> Handle(GetDailyRevenueQuery request, CancellationToken cancellationToken)
    {
        var bookings = await _bookingRepository.GetBookingsForReportAsync(request.StartDate, request.EndDate, cancellationToken);
        
        var result = bookings
            .Where(b => b.Status == NatureMiniPlex.Core.Domain.Enums.BookingStatus.Completed)
            .GroupBy(b => b.BookingTime.Date)
            .Select(g => new DailyRevenueDto(
                g.Key, 
                g.SelectMany(b => b.BookingItems ?? Enumerable.Empty<NatureMiniPlex.Core.Domain.Entities.BookingItem>())
                 .Where(i => i.ItemStatus == NatureMiniPlex.Core.Domain.Enums.ItemStatus.Active)
                 .Sum(i => i.Price)
            ))
            .OrderBy(r => r.Date)
            .ToList();

        return result;
    }
}

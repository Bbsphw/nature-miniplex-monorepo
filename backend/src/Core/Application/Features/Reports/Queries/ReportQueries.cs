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
        var bookings = await _bookingRepository.GetAllAsync(cancellationToken);
        
        var completedBookings = bookings.Where(b => b.Status == NatureMiniPlex.Core.Domain.Enums.BookingStatus.Completed
            && b.BookingTime.Date >= request.StartDate.Date 
            && b.BookingTime.Date <= request.EndDate.Date);

        var result = completedBookings
            .GroupBy(b => b.BookingTime.Date)
            .Select(g => new DailyRevenueDto(
                g.Key, 
                g.SelectMany(b => b.BookingItems).Where(i => i.ItemStatus == NatureMiniPlex.Core.Domain.Enums.ItemStatus.Active).Sum(i => i.Price)
            ))
            .OrderBy(r => r.Date)
            .ToList();

        return result;
    }
}

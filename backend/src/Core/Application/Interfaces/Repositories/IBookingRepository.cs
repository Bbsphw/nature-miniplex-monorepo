using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using NatureMiniPlex.Core.Domain.Entities;

namespace NatureMiniPlex.Core.Application.Interfaces.Repositories;

public interface IBookingRepository : IRepository<Booking>
{
    Task<IReadOnlyList<BookingItem>> GetBookedSeatsForShowtimeAsync(int showtimeId, CancellationToken cancellationToken = default);
    Task<Booking?> GetBookingWithItemsAsync(Guid id, CancellationToken cancellationToken = default);
}

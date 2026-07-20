using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NatureMiniPlex.Core.Application.Interfaces.Repositories;
using NatureMiniPlex.Core.Domain.Entities;
using NatureMiniPlex.Infrastructure.Persistence;

namespace NatureMiniPlex.Infrastructure.Repositories;

public class BookingRepository : Repository<Booking>, IBookingRepository
{
    public BookingRepository(ApplicationDbContext dbContext) : base(dbContext)
    {
    }

    public async Task<IReadOnlyList<BookingItem>> GetBookedSeatsForShowtimeAsync(int showtimeId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Set<BookingItem>()
            .Include(bi => bi.Booking)
                .ThenInclude(b => b.Customer)
            .Where(bi => bi.ShowtimeId == showtimeId && bi.ItemStatus != Core.Domain.Enums.ItemStatus.Canceled)
            .ToListAsync(cancellationToken);
    }

    public async Task<Booking?> GetBookingWithItemsAsync(System.Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(b => b.BookingItems)
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
    }
}

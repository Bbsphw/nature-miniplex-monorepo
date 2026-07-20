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

    public async Task<IReadOnlyList<NatureMiniPlex.Core.Application.DTOs.BookingDto>> GetPagedBookingsAsync(string? phoneNumber, int pageNumber, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = _dbSet.AsNoTracking();

        if (!string.IsNullOrEmpty(phoneNumber))
        {
            query = query.Where(b => b.Customer.PhoneNumber == phoneNumber);
        }

        return await query
            .OrderByDescending(b => b.BookingTime)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(b => new NatureMiniPlex.Core.Application.DTOs.BookingDto
            {
                Id = b.Id,
                CustomerId = b.CustomerId,
                BookingTime = b.BookingTime,
                Status = b.Status.ToString(),
                CustomerPhoneNumber = b.Customer.PhoneNumber
            })
            .ToListAsync(cancellationToken);
    }
}

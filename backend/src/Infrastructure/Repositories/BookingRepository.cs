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
            .Include(b => b.Customer)
            .Include(b => b.BookingItems)
                .ThenInclude(bi => bi.Showtime)
                    .ThenInclude(st => st.Movie)
            .Include(b => b.BookingItems)
                .ThenInclude(bi => bi.Showtime)
                    .ThenInclude(st => st.Cinema)
            .Include(b => b.BookingItems)
                .ThenInclude(bi => bi.Seat)
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<NatureMiniPlex.Core.Application.DTOs.BookingDto>> GetPagedBookingsAsync(string? phoneNumber, int pageNumber, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = _dbSet.AsNoTracking();

        if (!string.IsNullOrEmpty(phoneNumber))
        {
            query = query.Where(b => b.Customer.PhoneNumber.Contains(phoneNumber));
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
                CustomerPhoneNumber = b.Customer.PhoneNumber,
                BookingItems = b.BookingItems.Select(bi => new NatureMiniPlex.Core.Application.DTOs.BookingItemDto
                {
                    Id = bi.Id,
                    BookingId = bi.BookingId,
                    ShowtimeId = bi.ShowtimeId,
                    SeatId = bi.SeatId,
                    Price = bi.Price,
                    ItemStatus = bi.ItemStatus.ToString(),
                    SeatName = bi.Seat != null ? bi.Seat.ColumnName + bi.Seat.RowName : ""
                }).ToList()
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Booking>> GetBookingsForReportAsync(System.DateTime startDate, System.DateTime endDate, CancellationToken cancellationToken = default)
    {
        var start = startDate.Date;
        var end = endDate.Date.AddDays(1).AddTicks(-1);

        return await _dbSet
            .AsNoTracking()
            .Include(b => b.BookingItems)
            .Where(b => b.BookingTime >= start && b.BookingTime <= end)
            .ToListAsync(cancellationToken);
    }
}

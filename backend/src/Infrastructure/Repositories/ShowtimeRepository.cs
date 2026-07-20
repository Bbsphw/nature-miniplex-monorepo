using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NatureMiniPlex.Core.Application.Interfaces.Repositories;
using NatureMiniPlex.Core.Domain.Entities;
using NatureMiniPlex.Infrastructure.Persistence;

namespace NatureMiniPlex.Infrastructure.Repositories;

public class ShowtimeRepository : Repository<Showtime>, IShowtimeRepository
{
    public ShowtimeRepository(ApplicationDbContext dbContext) : base(dbContext)
    {
    }

    public async Task<IReadOnlyList<Showtime>> GetShowtimesByCinemaAndDateAsync(int cinemaId, DateTime date, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(s => s.Movie)
            .Where(s => s.CinemaId == cinemaId && s.ShowDateTime.Date == date.Date && s.IsActive)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> GetShowtimeCountByCinemaAndDateAsync(int cinemaId, DateTime date, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .CountAsync(s => s.CinemaId == cinemaId && s.ShowDateTime.Date == date.Date && s.IsActive, cancellationToken);
    }

    public async Task<Showtime?> GetShowtimeWithBookingsAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(s => s.BookingItems)
                .ThenInclude(bi => bi.Booking)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }
}

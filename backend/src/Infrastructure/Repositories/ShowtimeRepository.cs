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

    public override async Task<Showtime?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet.IgnoreQueryFilters().FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
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

    public async Task<IReadOnlyList<NatureMiniPlex.Core.Application.DTOs.ShowtimeDto>> GetPagedShowtimesAsync(int? movieId, int? cinemaId, DateTime? date, int pageNumber, int pageSize, bool includeInactive = true, CancellationToken cancellationToken = default)
    {
        var query = _dbSet.AsNoTracking().AsQueryable();

        if (includeInactive)
        {
            query = query.IgnoreQueryFilters();
        }
        else
        {
            query = query.Where(s => s.IsActive);
        }

        if (movieId.HasValue)
            query = query.Where(s => s.MovieId == movieId.Value);
            
        if (cinemaId.HasValue)
            query = query.Where(s => s.CinemaId == cinemaId.Value);
            
        if (date.HasValue)
            query = query.Where(s => s.ShowDateTime.Date == date.Value.Date);

        return await query
            .OrderBy(s => s.ShowDateTime)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new NatureMiniPlex.Core.Application.DTOs.ShowtimeDto
            {
                Id = s.Id,
                MovieId = s.MovieId,
                MovieTitle = s.Movie.Title,
                CinemaId = s.CinemaId,
                CinemaName = s.Cinema.Name,
                ShowDateTime = s.ShowDateTime,
                TicketPrice = s.TicketPrice,
                IsLocked = s.IsLocked,
                IsActive = s.IsActive
            })
            .ToListAsync(cancellationToken);
    }
}

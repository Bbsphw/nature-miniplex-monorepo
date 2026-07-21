using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using NatureMiniPlex.Core.Domain.Entities;

namespace NatureMiniPlex.Core.Application.Interfaces.Repositories;

public interface IShowtimeRepository : IRepository<Showtime>
{
    Task<IReadOnlyList<Showtime>> GetShowtimesByCinemaAndDateAsync(int cinemaId, DateTime date, CancellationToken cancellationToken = default);
    Task<int> GetShowtimeCountByCinemaAndDateAsync(int cinemaId, DateTime date, CancellationToken cancellationToken = default);
    Task<Showtime?> GetShowtimeWithBookingsAsync(int id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<NatureMiniPlex.Core.Application.DTOs.ShowtimeDto>> GetPagedShowtimesAsync(int? movieId, int? cinemaId, DateTime? date, int pageNumber, int pageSize, bool includeInactive = true, CancellationToken cancellationToken = default);
}

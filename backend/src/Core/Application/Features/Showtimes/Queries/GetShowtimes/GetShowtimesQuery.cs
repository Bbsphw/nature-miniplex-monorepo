using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.Extensions.Caching.Memory;
using NatureMiniPlex.Core.Application.Interfaces.Repositories;
using NatureMiniPlex.Core.Domain.Entities;

namespace NatureMiniPlex.Core.Application.Features.Showtimes.Queries.GetShowtimes;

public record GetShowtimesQuery(int? MovieId, int? CinemaId, DateTime? Date, int PageNumber = 1, int PageSize = 20, bool IncludeInactive = true) : IRequest<IReadOnlyList<NatureMiniPlex.Core.Application.DTOs.ShowtimeDto>>;

public class GetShowtimesQueryHandler : IRequestHandler<GetShowtimesQuery, IReadOnlyList<NatureMiniPlex.Core.Application.DTOs.ShowtimeDto>>
{
    private readonly IShowtimeRepository _showtimeRepository;
    private readonly IMemoryCache _cache;

    public GetShowtimesQueryHandler(IShowtimeRepository showtimeRepository, IMemoryCache cache)
    {
        _showtimeRepository = showtimeRepository;
        _cache = cache;
    }

    public async Task<IReadOnlyList<NatureMiniPlex.Core.Application.DTOs.ShowtimeDto>> Handle(GetShowtimesQuery request, CancellationToken cancellationToken)
    {
        var cacheKey = $"Showtimes_{request.MovieId}_{request.CinemaId}_{request.Date:yyyyMMdd}_{request.PageNumber}_{request.PageSize}_{request.IncludeInactive}";
        
        if (!_cache.TryGetValue(cacheKey, out IReadOnlyList<NatureMiniPlex.Core.Application.DTOs.ShowtimeDto>? showtimes))
        {
            showtimes = await _showtimeRepository.GetPagedShowtimesAsync(
                request.MovieId, request.CinemaId, request.Date, request.PageNumber, request.PageSize, request.IncludeInactive, cancellationToken);
                
            var cacheOptions = new MemoryCacheEntryOptions()
                .SetAbsoluteExpiration(TimeSpan.FromSeconds(1));
                
            _cache.Set(cacheKey, showtimes, cacheOptions);
        }

        return showtimes ?? new List<NatureMiniPlex.Core.Application.DTOs.ShowtimeDto>();
    }
}

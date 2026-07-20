using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using NatureMiniPlex.Core.Application.Interfaces.Repositories;
using NatureMiniPlex.Core.Domain.Entities;

namespace NatureMiniPlex.Core.Application.Features.Showtimes.Queries.GetShowtimes;

public record GetShowtimesQuery(int? MovieId, int? CinemaId, DateTime? Date) : IRequest<IReadOnlyList<Showtime>>;

public class GetShowtimesQueryHandler : IRequestHandler<GetShowtimesQuery, IReadOnlyList<Showtime>>
{
    private readonly IShowtimeRepository _showtimeRepository;

    public GetShowtimesQueryHandler(IShowtimeRepository showtimeRepository)
    {
        _showtimeRepository = showtimeRepository;
    }

    public async Task<IReadOnlyList<Showtime>> Handle(GetShowtimesQuery request, CancellationToken cancellationToken)
    {
        var showtimes = await _showtimeRepository.GetAllAsync(cancellationToken);
        
        var query = showtimes.Where(s => s.IsActive);
        
        if (request.MovieId.HasValue)
            query = query.Where(s => s.MovieId == request.MovieId.Value);
            
        if (request.CinemaId.HasValue)
            query = query.Where(s => s.CinemaId == request.CinemaId.Value);
            
        if (request.Date.HasValue)
            query = query.Where(s => s.ShowDateTime.Date == request.Date.Value.Date);
            
        return query.ToList();
    }
}

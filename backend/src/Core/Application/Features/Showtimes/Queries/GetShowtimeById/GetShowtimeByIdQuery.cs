using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using NatureMiniPlex.Core.Application.Interfaces.Repositories;
using NatureMiniPlex.Core.Domain.Entities;

namespace NatureMiniPlex.Core.Application.Features.Showtimes.Queries.GetShowtimeById;

public record GetShowtimeByIdQuery(int Id) : IRequest<Showtime>;

public class GetShowtimeByIdQueryHandler : IRequestHandler<GetShowtimeByIdQuery, Showtime>
{
    private readonly IShowtimeRepository _showtimeRepository;

    public GetShowtimeByIdQueryHandler(IShowtimeRepository showtimeRepository)
    {
        _showtimeRepository = showtimeRepository;
    }

    public async Task<Showtime> Handle(GetShowtimeByIdQuery request, CancellationToken cancellationToken)
    {
        var showtime = await _showtimeRepository.GetByIdAsync(request.Id, cancellationToken);
        if (showtime == null)
            throw new Exception($"Showtime with ID {request.Id} not found.");
            
        return showtime;
    }
}

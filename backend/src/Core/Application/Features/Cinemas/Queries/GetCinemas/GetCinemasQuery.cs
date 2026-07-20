using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using NatureMiniPlex.Core.Application.Interfaces.Repositories;
using NatureMiniPlex.Core.Domain.Entities;

namespace NatureMiniPlex.Core.Application.Features.Cinemas.Queries.GetCinemas;

public record GetCinemasQuery : IRequest<IReadOnlyList<Cinema>>;

public class GetCinemasQueryHandler : IRequestHandler<GetCinemasQuery, IReadOnlyList<Cinema>>
{
    private readonly ICinemaRepository _cinemaRepository;

    public GetCinemasQueryHandler(ICinemaRepository cinemaRepository)
    {
        _cinemaRepository = cinemaRepository;
    }

    public async Task<IReadOnlyList<Cinema>> Handle(GetCinemasQuery request, CancellationToken cancellationToken)
    {
        var cinemas = await _cinemaRepository.GetAllAsync(cancellationToken);
        return cinemas.Where(c => c.IsActive).ToList();
    }
}

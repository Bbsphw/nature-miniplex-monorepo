using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using NatureMiniPlex.Core.Application.Interfaces.Repositories;
using NatureMiniPlex.Core.Domain.Entities;

namespace NatureMiniPlex.Core.Application.Features.Movies.Queries.GetMovies;

public record GetMoviesQuery(bool OnlyActive = true) : IRequest<IReadOnlyList<Movie>>;

public class GetMoviesQueryHandler : IRequestHandler<GetMoviesQuery, IReadOnlyList<Movie>>
{
    private readonly IMovieRepository _movieRepository;

    public GetMoviesQueryHandler(IMovieRepository movieRepository)
    {
        _movieRepository = movieRepository;
    }

    public async Task<IReadOnlyList<Movie>> Handle(GetMoviesQuery request, CancellationToken cancellationToken)
    {
        if (request.OnlyActive)
        {
            return await _movieRepository.GetActiveMoviesAsync(cancellationToken);
        }
        return await _movieRepository.GetAllAsync(cancellationToken);
    }
}

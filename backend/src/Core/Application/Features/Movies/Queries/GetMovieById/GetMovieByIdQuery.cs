using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using NatureMiniPlex.Core.Application.Interfaces.Repositories;
using NatureMiniPlex.Core.Domain.Entities;

namespace NatureMiniPlex.Core.Application.Features.Movies.Queries.GetMovieById;

public record GetMovieByIdQuery(int Id) : IRequest<Movie>;

public class GetMovieByIdQueryHandler : IRequestHandler<GetMovieByIdQuery, Movie>
{
    private readonly IMovieRepository _movieRepository;

    public GetMovieByIdQueryHandler(IMovieRepository movieRepository)
    {
        _movieRepository = movieRepository;
    }

    public async Task<Movie> Handle(GetMovieByIdQuery request, CancellationToken cancellationToken)
    {
        var movie = await _movieRepository.GetByIdAsync(request.Id, cancellationToken);
        if (movie == null)
            throw new Exception($"Movie with ID {request.Id} not found.");
            
        return movie;
    }
}

using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using NatureMiniPlex.Core.Application.Interfaces;
using NatureMiniPlex.Core.Application.Interfaces.Repositories;

namespace NatureMiniPlex.Core.Application.Features.Movies.Commands.DeleteMovie;

public record DeleteMovieCommand(int Id) : IRequest;

public class DeleteMovieCommandHandler : IRequestHandler<DeleteMovieCommand>
{
    private readonly IMovieRepository _movieRepository;
    private readonly IUnitOfWork _unitOfWork;

    public DeleteMovieCommandHandler(IMovieRepository movieRepository, IUnitOfWork unitOfWork)
    {
        _movieRepository = movieRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(DeleteMovieCommand request, CancellationToken cancellationToken)
    {
        var movie = await _movieRepository.GetByIdAsync(request.Id, cancellationToken);
        if (movie == null)
            throw new Exception($"Movie with ID {request.Id} not found.");

        movie.IsActive = false; // Soft delete as per requirements

        await _movieRepository.UpdateAsync(movie, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}

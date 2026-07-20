using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using NatureMiniPlex.Core.Application.Interfaces;
using NatureMiniPlex.Core.Application.Interfaces.Repositories;
using NatureMiniPlex.Core.Domain.Entities;

namespace NatureMiniPlex.Core.Application.Features.Movies.Commands.UpdateMovie;

public record UpdateMovieCommand(int Id, string Title, DateTime StartDate, DateTime EndDate, decimal BasePrice, bool IsActive) : IRequest;

public class UpdateMovieCommandHandler : IRequestHandler<UpdateMovieCommand>
{
    private readonly IMovieRepository _movieRepository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateMovieCommandHandler(IMovieRepository movieRepository, IUnitOfWork unitOfWork)
    {
        _movieRepository = movieRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(UpdateMovieCommand request, CancellationToken cancellationToken)
    {
        var movie = await _movieRepository.GetByIdAsync(request.Id, cancellationToken);
        if (movie == null)
            throw new Exception($"Movie with ID {request.Id} not found.");

        if (request.StartDate > request.EndDate)
            throw new Exception("Start date cannot be after end date.");

        movie.Title = request.Title;
        movie.StartDate = request.StartDate;
        movie.EndDate = request.EndDate;
        movie.BasePrice = request.BasePrice;
        movie.IsActive = request.IsActive;

        await _movieRepository.UpdateAsync(movie, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}

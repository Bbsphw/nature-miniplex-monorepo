using System;
using System.Threading;
using System.Threading.Tasks;
using FluentValidation;
using MediatR;
using NatureMiniPlex.Core.Application.Interfaces;
using NatureMiniPlex.Core.Application.Interfaces.Repositories;
using NatureMiniPlex.Core.Domain.Entities;

namespace NatureMiniPlex.Core.Application.Features.Showtimes.Commands.CreateShowtime;

public record CreateShowtimeCommand(int CinemaId, int MovieId, DateTime ShowDateTime, decimal TicketPrice) : IRequest<int>;

public class CreateShowtimeCommandValidator : AbstractValidator<CreateShowtimeCommand>
{
    private readonly IShowtimeRepository _showtimeRepository;
    private readonly ICinemaRepository _cinemaRepository;
    private readonly IMovieRepository _movieRepository;

    public CreateShowtimeCommandValidator(
        IShowtimeRepository showtimeRepository, 
        ICinemaRepository cinemaRepository, 
        IMovieRepository movieRepository)
    {
        _showtimeRepository = showtimeRepository;
        _cinemaRepository = cinemaRepository;
        _movieRepository = movieRepository;

        RuleFor(x => x.CinemaId)
            .MustAsync(async (id, cancellation) => await _cinemaRepository.GetByIdAsync(id, cancellation) != null)
            .WithMessage("Cinema does not exist.");

        RuleFor(x => x.MovieId)
            .MustAsync(async (id, cancellation) => await _movieRepository.ExistsAsync(id, cancellation))
            .WithMessage("Movie does not exist.");

        RuleFor(x => x.ShowDateTime)
            .GreaterThan(DateTime.UtcNow)
            .WithMessage("Showtime must be in the future.");

        RuleFor(x => x)
            .MustAsync(async (command, cancellation) => 
            {
                var count = await _showtimeRepository.GetShowtimeCountByCinemaAndDateAsync(command.CinemaId, command.ShowDateTime.Date, cancellation);
                return count < 3;
            })
            .WithMessage("A cinema can have a maximum of 3 showtimes per day.");
    }
}

public class CreateShowtimeCommandHandler : IRequestHandler<CreateShowtimeCommand, int>
{
    private readonly IShowtimeRepository _showtimeRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateShowtimeCommandHandler(IShowtimeRepository showtimeRepository, IUnitOfWork unitOfWork)
    {
        _showtimeRepository = showtimeRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<int> Handle(CreateShowtimeCommand request, CancellationToken cancellationToken)
    {
        var showtime = new Showtime
        {
            CinemaId = request.CinemaId,
            MovieId = request.MovieId,
            ShowDateTime = request.ShowDateTime,
            TicketPrice = request.TicketPrice,
            IsActive = true
        };

        await _showtimeRepository.AddAsync(showtime, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return showtime.Id;
    }
}

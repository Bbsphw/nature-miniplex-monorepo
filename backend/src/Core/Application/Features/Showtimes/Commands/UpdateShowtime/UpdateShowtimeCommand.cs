using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using NatureMiniPlex.Core.Application.Interfaces;
using NatureMiniPlex.Core.Application.Interfaces.Repositories;

namespace NatureMiniPlex.Core.Application.Features.Showtimes.Commands.UpdateShowtime;

public record UpdateShowtimeCommand(int Id, int CinemaId, int MovieId, DateTime ShowDateTime, decimal TicketPrice, bool IsActive) : IRequest;

public class UpdateShowtimeCommandHandler : IRequestHandler<UpdateShowtimeCommand>
{
    private readonly IShowtimeRepository _showtimeRepository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateShowtimeCommandHandler(IShowtimeRepository showtimeRepository, IUnitOfWork unitOfWork)
    {
        _showtimeRepository = showtimeRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(UpdateShowtimeCommand request, CancellationToken cancellationToken)
    {
        var showtime = await _showtimeRepository.GetByIdAsync(request.Id, cancellationToken);
        if (showtime == null) throw new Exception("Showtime not found.");

        showtime.CinemaId = request.CinemaId;
        showtime.MovieId = request.MovieId;
        showtime.ShowDateTime = request.ShowDateTime;
        showtime.TicketPrice = request.TicketPrice;
        showtime.IsActive = request.IsActive;

        await _showtimeRepository.UpdateAsync(showtime, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}

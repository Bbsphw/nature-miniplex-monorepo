using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using NatureMiniPlex.Core.Application.Interfaces;
using NatureMiniPlex.Core.Application.Interfaces.Repositories;

namespace NatureMiniPlex.Core.Application.Features.Showtimes.Commands.DeleteShowtime;

public record DeleteShowtimeCommand(int Id) : IRequest;

public class DeleteShowtimeCommandHandler : IRequestHandler<DeleteShowtimeCommand>
{
    private readonly IShowtimeRepository _showtimeRepository;
    private readonly IUnitOfWork _unitOfWork;

    public DeleteShowtimeCommandHandler(IShowtimeRepository showtimeRepository, IUnitOfWork unitOfWork)
    {
        _showtimeRepository = showtimeRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(DeleteShowtimeCommand request, CancellationToken cancellationToken)
    {
        var showtime = await _showtimeRepository.GetByIdAsync(request.Id, cancellationToken);
        if (showtime == null) throw new Exception("Showtime not found.");

        showtime.IsActive = false; // Soft delete

        await _showtimeRepository.UpdateAsync(showtime, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}

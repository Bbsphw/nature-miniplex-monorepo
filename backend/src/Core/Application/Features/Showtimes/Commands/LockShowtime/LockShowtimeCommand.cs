using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using NatureMiniPlex.Core.Application.Interfaces;
using NatureMiniPlex.Core.Application.Interfaces.Repositories;

namespace NatureMiniPlex.Core.Application.Features.Showtimes.Commands.LockShowtime;

public record LockShowtimeCommand(int ShowtimeId) : IRequest<bool>;

public class LockShowtimeCommandHandler : IRequestHandler<LockShowtimeCommand, bool>
{
    private readonly IShowtimeRepository _showtimeRepository;
    private readonly IUnitOfWork _unitOfWork;

    public LockShowtimeCommandHandler(IShowtimeRepository showtimeRepository, IUnitOfWork unitOfWork)
    {
        _showtimeRepository = showtimeRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<bool> Handle(LockShowtimeCommand request, CancellationToken cancellationToken)
    {
        var showtime = await _showtimeRepository.GetByIdAsync(request.ShowtimeId, cancellationToken);
        if (showtime == null) throw new Exception("Showtime not found.");

        if (showtime.IsLocked) return true;

        showtime.LockShowtime();
        
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}

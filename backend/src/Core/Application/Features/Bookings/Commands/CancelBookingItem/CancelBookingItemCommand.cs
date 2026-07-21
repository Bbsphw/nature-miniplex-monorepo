using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using NatureMiniPlex.Core.Application.Interfaces;
using NatureMiniPlex.Core.Application.Interfaces.Repositories;
using NatureMiniPlex.Core.Domain.Enums;

namespace NatureMiniPlex.Core.Application.Features.Bookings.Commands.CancelBookingItem;

public record CancelBookingItemCommand(Guid BookingId, Guid BookingItemId, string PhoneNumber) : IRequest<bool>;

public class CancelBookingItemCommandHandler : IRequestHandler<CancelBookingItemCommand, bool>
{
    private readonly IBookingRepository _bookingRepository;
    private readonly IShowtimeRepository _showtimeRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CancelBookingItemCommandHandler(IBookingRepository bookingRepository, IShowtimeRepository showtimeRepository, IUnitOfWork unitOfWork)
    {
        _bookingRepository = bookingRepository;
        _showtimeRepository = showtimeRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<bool> Handle(CancelBookingItemCommand request, CancellationToken cancellationToken)
    {
        // Use GetBookingWithItemsAsync so that Customer navigation property is included
        var booking = await _bookingRepository.GetBookingWithItemsAsync(request.BookingId, cancellationToken);

        if (booking == null) throw new Exception("Booking not found.");

        // Normalize phone numbers (strip non-digit chars) for a robust comparison
        var customerPhone = new string((booking.Customer?.PhoneNumber ?? string.Empty).Where(char.IsDigit).ToArray());
        var requestPhone  = new string((request.PhoneNumber ?? string.Empty).Where(char.IsDigit).ToArray());

        if (string.IsNullOrEmpty(customerPhone) || customerPhone != requestPhone)
            throw new Exception("Phone number does not match the booking owner.");

        var item = booking.BookingItems?.FirstOrDefault(i => i.Id == request.BookingItemId);
        if (item == null) throw new Exception("Booking item not found.");

        var showtime = await _showtimeRepository.GetByIdAsync(item.ShowtimeId, cancellationToken);
        if (showtime != null && showtime.IsLocked) throw new Exception("Showtime is locked. Cannot cancel ticket.");

        item.ItemStatus = ItemStatus.Canceled;

        // If all items are now canceled, mark the whole booking as canceled too
        if (booking.BookingItems != null && booking.BookingItems.All(i => i.ItemStatus == ItemStatus.Canceled))
        {
            booking.Status = BookingStatus.Canceled;
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }
}

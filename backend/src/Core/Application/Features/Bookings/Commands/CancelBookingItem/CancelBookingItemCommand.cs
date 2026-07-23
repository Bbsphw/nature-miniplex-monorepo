using System;
using System.Linq;
using System.Security;
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
    private readonly ICurrentUserService _currentUserService;

    public CancelBookingItemCommandHandler(
        IBookingRepository bookingRepository,
        IShowtimeRepository showtimeRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService)
    {
        _bookingRepository = bookingRepository;
        _showtimeRepository = showtimeRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(CancelBookingItemCommand request, CancellationToken cancellationToken)
    {
        // Use GetBookingWithItemsAsync so that Customer navigation property is included
        var booking = await _bookingRepository.GetBookingWithItemsAsync(request.BookingId, cancellationToken);

        if (booking == null)
            throw new KeyNotFoundException($"Booking with ID '{request.BookingId}' was not found.");

        var item = booking.BookingItems?.FirstOrDefault(i => i.Id == request.BookingItemId);
        if (item == null)
            throw new KeyNotFoundException($"Booking item with ID '{request.BookingItemId}' was not found.");

        // =========================================================================
        // ROW-LEVEL SECURITY (RLS) & OWNERSHIP VALIDATION
        // =========================================================================

        bool hasAdminCancel = await _currentUserService.HasPermissionAsync("bookings:cancel:any");
        if (!hasAdminCancel)
        {
            bool hasManagerCancel = await _currentUserService.HasPermissionAsync("bookings:cancel:assigned_cinema");
            if (hasManagerCancel)
            {
                var showtime = await _showtimeRepository.GetByIdAsync(item.ShowtimeId, cancellationToken);
                if (showtime != null && _currentUserService.CinemaId.HasValue && showtime.CinemaId != _currentUserService.CinemaId.Value)
                {
                    throw new SecurityException("Cinema Managers can only cancel bookings for their assigned cinema.");
                }
            }
            else
            {
                // External Customer Identity Verification: Phone Number must match the booking owner
                var customerPhone = new string((booking.Customer?.PhoneNumber ?? string.Empty).Where(char.IsDigit).ToArray());
                var requestPhone  = new string((request.PhoneNumber ?? string.Empty).Where(char.IsDigit).ToArray());

                if (string.IsNullOrEmpty(customerPhone) || string.IsNullOrEmpty(requestPhone) || customerPhone != requestPhone)
                {
                    throw new SecurityException("เบอร์โทรศัพท์ยืนยันตัวตนไม่ถูกต้อง ไม่ตรงกับเบอร์ที่ใช้จองตั๋วใบนี้");
                }
            }
        }

        var showtimeEntity = await _showtimeRepository.GetByIdAsync(item.ShowtimeId, cancellationToken);
        if (showtimeEntity != null && showtimeEntity.IsLocked)
            throw new NatureMiniPlex.Core.Domain.Exceptions.DomainException("Showtime is locked. Cannot cancel ticket.");

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

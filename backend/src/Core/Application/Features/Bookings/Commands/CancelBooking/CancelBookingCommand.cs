using System;
using System.Collections.Generic;
using System.Linq;
using System.Security;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using NatureMiniPlex.Core.Application.Interfaces;
using NatureMiniPlex.Core.Application.Interfaces.Repositories;
using NatureMiniPlex.Core.Domain.Enums;

namespace NatureMiniPlex.Core.Application.Features.Bookings.Commands.CancelBooking;

public record CancelBookingCommand(Guid BookingId, string PhoneNumber) : IRequest<bool>;

public class CancelBookingCommandHandler : IRequestHandler<CancelBookingCommand, bool>
{
    private readonly IBookingRepository _bookingRepository;
    private readonly IShowtimeRepository _showtimeRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public CancelBookingCommandHandler(
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

    public async Task<bool> Handle(CancelBookingCommand request, CancellationToken cancellationToken)
    {
        var booking = await _bookingRepository.GetBookingWithItemsAsync(request.BookingId, cancellationToken);
        
        if (booking == null)
        {
            throw new KeyNotFoundException($"Booking with ID '{request.BookingId}' was not found.");
        }

        // =========================================================================
        // ROW-LEVEL SECURITY (RLS) & OWNERSHIP VALIDATION
        // =========================================================================

        bool hasAdminCancel = await _currentUserService.HasPermissionAsync("bookings:cancel:any");
        if (!hasAdminCancel)
        {
            bool hasManagerCancel = await _currentUserService.HasPermissionAsync("bookings:cancel:assigned_cinema");
            if (hasManagerCancel)
            {
                var firstItem = booking.BookingItems?.FirstOrDefault();
                if (firstItem != null)
                {
                    var showtime = await _showtimeRepository.GetByIdAsync(firstItem.ShowtimeId, cancellationToken);
                    if (showtime != null && _currentUserService.CinemaId.HasValue && showtime.CinemaId != _currentUserService.CinemaId.Value)
                    {
                        throw new SecurityException("Cinema Managers can only cancel bookings for their assigned cinema.");
                    }
                }
            }
            else
            {
                // External Customer Identity Verification: Phone Number must match the booking owner
                var customerPhone = booking.Customer?.PhoneNumber?.Trim() ?? string.Empty;
                var requestPhone = request.PhoneNumber?.Trim() ?? string.Empty;

                var cleanCustomerPhone = new string(customerPhone.Where(char.IsDigit).ToArray());
                var cleanRequestPhone = new string(requestPhone.Where(char.IsDigit).ToArray());

                if (string.IsNullOrEmpty(cleanCustomerPhone) || string.IsNullOrEmpty(cleanRequestPhone) || !string.Equals(cleanCustomerPhone, cleanRequestPhone, StringComparison.OrdinalIgnoreCase))
                {
                    throw new SecurityException("เบอร์โทรศัพท์ยืนยันตัวตนไม่ถูกต้อง ไม่ตรงกับเบอร์ที่ใช้จองตั๋วใบนี้");
                }
            }
        }

        // Check if showtime is locked
        var bookingItem = booking.BookingItems?.FirstOrDefault();
        if (bookingItem != null)
        {
             var showtime = await _showtimeRepository.GetByIdAsync(bookingItem.ShowtimeId, cancellationToken);
             if (showtime != null && showtime.IsLocked)
             {
                 throw new NatureMiniPlex.Core.Domain.Exceptions.DomainException("Showtime is locked. Cannot cancel tickets.");
             }
        }

        booking.Status = BookingStatus.Canceled;
        if (booking.BookingItems != null)
        {
             foreach (var item in booking.BookingItems)
             {
                 item.ItemStatus = ItemStatus.Canceled;
             }
        }
        
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}

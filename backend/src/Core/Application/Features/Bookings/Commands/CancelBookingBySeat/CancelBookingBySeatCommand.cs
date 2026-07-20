using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using NatureMiniPlex.Core.Application.Interfaces;
using NatureMiniPlex.Core.Application.Interfaces.Repositories;
using NatureMiniPlex.Core.Domain.Enums;

namespace NatureMiniPlex.Core.Application.Features.Bookings.Commands.CancelBookingBySeat;

public record CancelBookingBySeatCommand(int ShowtimeId, int SeatId, string PhoneNumber) : IRequest<bool>;

public class CancelBookingBySeatCommandHandler : IRequestHandler<CancelBookingBySeatCommand, bool>
{
    private readonly IBookingRepository _bookingRepository;
    private readonly IShowtimeRepository _showtimeRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CancelBookingBySeatCommandHandler(
        IBookingRepository bookingRepository,
        IShowtimeRepository showtimeRepository,
        IUnitOfWork unitOfWork)
    {
        _bookingRepository = bookingRepository;
        _showtimeRepository = showtimeRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<bool> Handle(CancelBookingBySeatCommand request, CancellationToken cancellationToken)
    {
        var showtime = await _showtimeRepository.GetByIdAsync(request.ShowtimeId, cancellationToken);
        if (showtime == null) throw new Exception("ไม่พบรอบฉายนี้");
        if (showtime.IsLocked) throw new Exception("รอบฉายนี้ถูกล็อคแล้ว ไม่สามารถยกเลิกการจองได้");

        var bookedItems = await _bookingRepository.GetBookedSeatsForShowtimeAsync(request.ShowtimeId, cancellationToken);
        var targetItem = bookedItems.FirstOrDefault(b => b.SeatId == request.SeatId);

        if (targetItem == null) throw new Exception("ไม่พบรายการจองสำหรับที่นั่งนี้");

        var customerPhone = targetItem.Booking?.Customer?.PhoneNumber?.Trim() ?? string.Empty;
        var requestPhone = request.PhoneNumber?.Trim() ?? string.Empty;

        var cleanCustomerPhone = new string(customerPhone.Where(char.IsDigit).ToArray());
        var cleanRequestPhone = new string(requestPhone.Where(char.IsDigit).ToArray());

        if (string.IsNullOrEmpty(cleanCustomerPhone) || !string.Equals(cleanCustomerPhone, cleanRequestPhone, StringComparison.OrdinalIgnoreCase))
        {
            throw new Exception($"เบอร์โทรศัพท์ไม่ตรงกับผู้จองที่นั่งนี้ (ในระบบ: {customerPhone}, เบอร์ที่คุณกรอก: {requestPhone})");
        }

        targetItem.ItemStatus = ItemStatus.Canceled;

        // Check if all items in this booking are canceled
        if (targetItem.Booking != null && targetItem.Booking.BookingItems.All(i => i.ItemStatus == ItemStatus.Canceled))
        {
            targetItem.Booking.Status = BookingStatus.Canceled;
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }
}

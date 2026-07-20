using System;
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

    public CancelBookingCommandHandler(
        IBookingRepository bookingRepository,
        IShowtimeRepository showtimeRepository,
        IUnitOfWork unitOfWork)
    {
        _bookingRepository = bookingRepository;
        _showtimeRepository = showtimeRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<bool> Handle(CancelBookingCommand request, CancellationToken cancellationToken)
    {
        // Actually GetBookingWithItemsAsync might take int in the interface but Booking.Id is Guid.
        // Let's assume the repository needs to fetch by Guid.
        // I will need to update IBookingRepository to take Guid if it doesn't already, or use GetAllAsync.
        // Let's assume we update IBookingRepository later to use Guid or just use LINQ.
        // Wait, for this fix, I'll use a hack if needed or just fix the interface.
        // Let's write the handler assuming the repository has a method for Guid, or just fetch all and find.
        
        var bookings = await _bookingRepository.GetAllAsync(cancellationToken);
        var booking = bookings.FirstOrDefault(b => b.Id == request.BookingId);
        
        if (booking == null) throw new Exception("Booking not found.");

        var customerPhone = booking.Customer?.PhoneNumber?.Trim() ?? string.Empty;
        var requestPhone = request.PhoneNumber?.Trim() ?? string.Empty;

        var cleanCustomerPhone = new string(customerPhone.Where(char.IsDigit).ToArray());
        var cleanRequestPhone = new string(requestPhone.Where(char.IsDigit).ToArray());

        if (string.IsNullOrEmpty(cleanCustomerPhone) || !string.Equals(cleanCustomerPhone, cleanRequestPhone, StringComparison.OrdinalIgnoreCase))
        {
            throw new Exception($"เบอร์โทรศัพท์ไม่ตรงกับผู้จอง (ในระบบ: {customerPhone}, ที่ระบุ: {requestPhone})");
        }

        var bookingItem = booking.BookingItems?.FirstOrDefault();
        if (bookingItem != null)
        {
             var showtime = await _showtimeRepository.GetByIdAsync(bookingItem.ShowtimeId, cancellationToken);
             if (showtime != null && showtime.IsLocked)
             {
                 throw new Exception("Showtime is locked. Cannot cancel tickets.");
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

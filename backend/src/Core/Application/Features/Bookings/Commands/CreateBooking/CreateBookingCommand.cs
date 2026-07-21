using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentValidation;
using MediatR;
using NatureMiniPlex.Core.Application.Interfaces;
using NatureMiniPlex.Core.Application.Interfaces.Repositories;
using NatureMiniPlex.Core.Domain.Entities;
using NatureMiniPlex.Core.Domain.Enums;

namespace NatureMiniPlex.Core.Application.Features.Bookings.Commands.CreateBooking;

public record CreateBookingCommand(int ShowtimeId, string PhoneNumber, string? Email, List<int> SeatIds) : IRequest<Guid>;

public class CreateBookingCommandValidator : AbstractValidator<CreateBookingCommand>
{
    public CreateBookingCommandValidator()
    {
        RuleFor(x => x.PhoneNumber)
            .NotEmpty().WithMessage("กรุณากรอกเบอร์โทรศัพท์")
            .Matches(@"^\d{9,10}$").WithMessage("รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (ต้องเป็นตัวเลข 9-10 หลัก)");

        RuleFor(x => x.Email)
            .EmailAddress().When(x => !string.IsNullOrEmpty(x.Email))
            .WithMessage("รูปแบบอีเมลไม่ถูกต้อง");

        RuleFor(x => x.SeatIds)
            .NotEmpty().WithMessage("กรุณาเลือกที่นั่งอย่างน้อย 1 ที่นั่ง")
            .Must(seats => seats.Count <= 4).WithMessage("เลือกได้สูงสุดไม่เกิน 4 ที่นั่งต่อการจอง");
    }
}

public class CreateBookingCommandHandler : IRequestHandler<CreateBookingCommand, Guid>
{
    private readonly IShowtimeRepository _showtimeRepository;
    private readonly IBookingRepository _bookingRepository;
    private readonly IRepository<Customer> _customerRepository;
    private readonly IEmailService _emailService;
    private readonly IUnitOfWork _unitOfWork;

    public CreateBookingCommandHandler(
        IShowtimeRepository showtimeRepository,
        IBookingRepository bookingRepository,
        IRepository<Customer> customerRepository,
        IEmailService emailService,
        IUnitOfWork unitOfWork)
    {
        _showtimeRepository = showtimeRepository;
        _bookingRepository = bookingRepository;
        _customerRepository = customerRepository;
        _emailService = emailService;
        _unitOfWork = unitOfWork;
    }

    public async Task<Guid> Handle(CreateBookingCommand request, CancellationToken cancellationToken)
    {
        var showtime = await _showtimeRepository.GetByIdAsync(request.ShowtimeId, cancellationToken);
        if (showtime == null) throw new NatureMiniPlex.Core.Domain.Exceptions.DomainException("ไม่พบรอบฉายที่ระบุ");
        showtime.EnsureCanBookOrCancel();

        var existingBookings = await _bookingRepository.GetBookedSeatsForShowtimeAsync(request.ShowtimeId, cancellationToken);
        
        // Check if any of the requested seats are already booked
        if (request.SeatIds.Any(seatId => existingBookings.Any(b => b.SeatId == seatId)))
        {
            throw new Exception("ที่นั่งบางรายการที่ท่านเลือกถูกจองไปแล้ว กรุณาเลือกรอบหรือที่นั่งใหม่");
        }

        // Check if the same phone number has reached the 4-seat limit for this showtime
        var alreadyBookedCount = existingBookings.Count(b =>
            b.Booking != null &&
            b.Booking.Customer != null &&
            b.Booking.Customer.PhoneNumber == request.PhoneNumber);

        if (alreadyBookedCount + request.SeatIds.Count > 4)
        {
            throw new Exception(
                $"เบอร์โทรศัพท์นี้เคยจองไปแล้ว {alreadyBookedCount} ที่นั่งในรอบฉายนี้ ไม่สามารถจองเพิ่มอีก {request.SeatIds.Count} ที่นั่งได้ (จำกัดสูงสุด 4 ที่นั่งต่อเบอร์โทรศัพท์ต่อรอบฉาย)");
        }
        
        // Find or create customer
        var customers = await _customerRepository.GetAllAsync(cancellationToken);
        var customer = customers.FirstOrDefault(c => c.PhoneNumber == request.PhoneNumber);
        if (customer == null)
        {
            customer = new Customer { PhoneNumber = request.PhoneNumber, CreatedAt = DateTime.UtcNow };
            await _customerRepository.AddAsync(customer, cancellationToken);
        }
        
        if (!string.IsNullOrEmpty(request.Email))
        {
            customer.Email = request.Email;
        }

        var booking = new Booking
        {
            CustomerId = customer.Id,
            BookingTime = DateTime.UtcNow,
            Status = BookingStatus.Completed
        };

        foreach (var seatId in request.SeatIds)
        {
            booking.BookingItems.Add(new BookingItem
            {
                ShowtimeId = request.ShowtimeId,
                SeatId = seatId,
                Price = showtime.TicketPrice,
                ItemStatus = ItemStatus.Active
            });
        }

        await _bookingRepository.AddAsync(booking, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        if (!string.IsNullOrEmpty(customer.Email))
        {
            var subject = $"การจองสำเร็จ - ยืนยันตั๋วภาพยนตร์รหัส {booking.Id.ToString().Substring(0, 8).ToUpper()}";
            var html = $@"
                    <div style='font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;'>
                        <div style='background-color: #E31837; padding: 20px; text-align: center;'>
                            <h2 style='color: white; margin: 0;'>Nature MiniPlex</h2>
                        </div>
                        <div style='padding: 30px;'>
                            <h3 style='color: #E31837;'>จองตั๋วสำเร็จ!</h3>
                            <p>ขอบคุณสำหรับการจองตั๋วภาพยนตร์กับ Nature MiniPlex</p>
                            <p>รหัสอ้างอิงการจอง (Booking Reference):</p>
                            <div style='background-color: #f5f5f5; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 18px; text-align: center; margin: 20px 0;'>
                                <strong>{booking.Id}</strong>
                            </div>
                            <p>คุณสามารถดูและดาวน์โหลด E-Ticket ของคุณได้ที่ลิงก์ด้านล่าง เพื่อนำไปสแกนเข้าโรงภาพยนตร์:</p>
                            <div style='text-align: center; margin: 30px 0;'>
                                <a href='http://localhost:3000/booking-confirmation/{booking.Id}' style='background-color: #E31837; color: white; text-decoration: none; padding: 12px 25px; border-radius: 30px; font-weight: bold; display: inline-block;'>ดู E-Ticket ของคุณ</a>
                            </div>
                            <p style='color: #888; font-size: 12px; margin-top: 40px;'>หากมีข้อสงสัย กรุณาติดต่อพนักงานหน้าโรงภาพยนตร์</p>
                        </div>
                    </div>";

            // Send email asynchronously without blocking (fire and forget for MVP)
            _ = Task.Run(() => _emailService.SendEmailAsync(customer.Email, subject, html));
        }

        return booking.Id;
    }
}

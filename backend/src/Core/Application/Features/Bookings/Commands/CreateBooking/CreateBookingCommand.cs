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

public record CreateBookingCommand(int ShowtimeId, string PhoneNumber, List<int> SeatIds) : IRequest<Guid>;

public class CreateBookingCommandValidator : AbstractValidator<CreateBookingCommand>
{
    public CreateBookingCommandValidator()
    {
        RuleFor(x => x.PhoneNumber)
            .NotEmpty().WithMessage("Phone number is required.")
            .Matches(@"^\d{9,10}$").WithMessage("Invalid phone number format.");

        RuleFor(x => x.SeatIds)
            .NotEmpty().WithMessage("At least one seat must be selected.")
            .Must(seats => seats.Count <= 4).WithMessage("Maximum of 4 seats allowed per booking.");
    }
}

public class CreateBookingCommandHandler : IRequestHandler<CreateBookingCommand, Guid>
{
    private readonly IShowtimeRepository _showtimeRepository;
    private readonly IBookingRepository _bookingRepository;
    private readonly IRepository<Customer> _customerRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateBookingCommandHandler(
        IShowtimeRepository showtimeRepository,
        IBookingRepository bookingRepository,
        IRepository<Customer> customerRepository,
        IUnitOfWork unitOfWork)
    {
        _showtimeRepository = showtimeRepository;
        _bookingRepository = bookingRepository;
        _customerRepository = customerRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Guid> Handle(CreateBookingCommand request, CancellationToken cancellationToken)
    {
        var showtime = await _showtimeRepository.GetByIdAsync(request.ShowtimeId, cancellationToken);
        if (showtime == null) throw new Exception("Showtime not found.");
        if (showtime.IsLocked) throw new Exception("Showtime is locked. Cannot book tickets.");

        var existingBookings = await _bookingRepository.GetBookedSeatsForShowtimeAsync(request.ShowtimeId, cancellationToken);
        
        // Check if any of the requested seats are already booked
        if (request.SeatIds.Any(seatId => existingBookings.Any(b => b.SeatId == seatId)))
        {
            throw new Exception("One or more selected seats are already booked.");
        }

        // Check if the same phone number already booked in this showtime
        if (existingBookings.Any(b => b.Booking != null && b.Booking.Customer != null && b.Booking.Customer.PhoneNumber == request.PhoneNumber))
        {
            throw new Exception("This phone number has already booked a seat for this showtime.");
        }
        
        // Find or create customer
        var customers = await _customerRepository.GetAllAsync(cancellationToken);
        var customer = customers.FirstOrDefault(c => c.PhoneNumber == request.PhoneNumber);
        if (customer == null)
        {
            customer = new Customer { PhoneNumber = request.PhoneNumber, CreatedAt = DateTime.UtcNow };
            await _customerRepository.AddAsync(customer, cancellationToken);
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

        return booking.Id;
    }
}

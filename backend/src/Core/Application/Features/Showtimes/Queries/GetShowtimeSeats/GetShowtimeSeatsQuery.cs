using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using NatureMiniPlex.Core.Application.Interfaces.Repositories;

namespace NatureMiniPlex.Core.Application.Features.Showtimes.Queries.GetShowtimeSeats;

public record SeatStatusDto(int SeatId, string RowName, string ColumnName, string Status, string? BookerPhone, string RowVersion);

public record GetShowtimeSeatsQuery(int Id) : IRequest<List<SeatStatusDto>>;

public class GetShowtimeSeatsQueryHandler : IRequestHandler<GetShowtimeSeatsQuery, List<SeatStatusDto>>
{
    private readonly IShowtimeRepository _showtimeRepository;
    private readonly ICinemaRepository _cinemaRepository;
    private readonly IBookingRepository _bookingRepository;

    public GetShowtimeSeatsQueryHandler(IShowtimeRepository showtimeRepository, ICinemaRepository cinemaRepository, IBookingRepository bookingRepository)
    {
        _showtimeRepository = showtimeRepository;
        _cinemaRepository = cinemaRepository;
        _bookingRepository = bookingRepository;
    }

    public async Task<List<SeatStatusDto>> Handle(GetShowtimeSeatsQuery request, CancellationToken cancellationToken)
    {
        var showtime = await _showtimeRepository.GetByIdAsync(request.Id, cancellationToken);
        if (showtime == null) throw new Exception("Showtime not found.");

        var cinema = await _cinemaRepository.GetCinemaWithSeatsAsync(showtime.CinemaId, cancellationToken);
        if (cinema == null) throw new Exception("Cinema not found.");

        var bookedItems = await _bookingRepository.GetBookedSeatsForShowtimeAsync(request.Id, cancellationToken);

        var result = new List<SeatStatusDto>();
        foreach (var seat in cinema.Seats)
        {
            var booking = bookedItems.FirstOrDefault(b => b.SeatId == seat.Id);
            bool isBooked = booking != null;
            string? phone = isBooked && booking?.Booking?.Customer != null ? booking.Booking.Customer.PhoneNumber : null;

            result.Add(new SeatStatusDto(
                seat.Id, 
                seat.RowName, 
                seat.ColumnName, 
                isBooked ? "Booked" : "Available", 
                phone, 
                Convert.ToBase64String(showtime.RowVersion ?? Array.Empty<byte>())
            ));
        }

        return result.OrderBy(s => s.RowName).ThenBy(s => s.ColumnName).ToList();
    }
}

using System;
using System.Collections.Generic;

namespace NatureMiniPlex.Core.Application.DTOs;

public class BookingItemDto
{
    public Guid Id { get; set; }
    public Guid BookingId { get; set; }
    public int ShowtimeId { get; set; }
    public int SeatId { get; set; }
    public decimal Price { get; set; }
    public string ItemStatus { get; set; } = null!;
    public string SeatName { get; set; } = null!;
}

public class BookingDto
{
    public Guid Id { get; set; }
    public Guid CustomerId { get; set; }
    public DateTime BookingTime { get; set; }
    public string Status { get; set; } = null!;
    public string CustomerPhoneNumber { get; set; } = null!;
    public List<BookingItemDto> BookingItems { get; set; } = new();
}

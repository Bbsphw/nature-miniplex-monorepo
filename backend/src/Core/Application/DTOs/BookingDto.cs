using System;

namespace NatureMiniPlex.Core.Application.DTOs;

public class BookingDto
{
    public Guid Id { get; set; }
    public Guid CustomerId { get; set; }
    public DateTime BookingTime { get; set; }
    public string Status { get; set; } = null!;
    public string CustomerPhoneNumber { get; set; } = null!;
}

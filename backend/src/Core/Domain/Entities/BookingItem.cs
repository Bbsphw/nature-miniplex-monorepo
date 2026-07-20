using System;
using NatureMiniPlex.Core.Domain.Common;
using NatureMiniPlex.Core.Domain.Enums;

namespace NatureMiniPlex.Core.Domain.Entities;

public class BookingItem : BaseEntity
{
    public BookingItem()
    {
        Id = SequentialGuidGenerator.Create();
    }

    public Guid Id { get; set; }
    public Guid BookingId { get; set; }
    public int ShowtimeId { get; set; }
    public int SeatId { get; set; }
    public decimal Price { get; set; }
    public ItemStatus ItemStatus { get; set; }
    public byte[] RowVersion { get; set; } = null!;

    public Booking Booking { get; set; } = null!;
    public Showtime Showtime { get; set; } = null!;
    public Seat Seat { get; set; } = null!;
}

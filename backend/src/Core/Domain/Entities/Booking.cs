using System;
using System.Collections.Generic;
using NatureMiniPlex.Core.Domain.Common;
using NatureMiniPlex.Core.Domain.Enums;

namespace NatureMiniPlex.Core.Domain.Entities;

public class Booking : BaseEntity
{
    public Booking()
    {
        Id = SequentialGuidGenerator.Create();
    }

    public Guid Id { get; set; }
    public Guid CustomerId { get; set; }
    public DateTime BookingTime { get; set; }
    public BookingStatus Status { get; set; }

    public Customer Customer { get; set; } = null!;
    public ICollection<BookingItem> BookingItems { get; set; } = new List<BookingItem>();
}

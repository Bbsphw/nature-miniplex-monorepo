using System;
using System.Collections.Generic;
using NatureMiniPlex.Core.Domain.Common;

namespace NatureMiniPlex.Core.Domain.Entities;

public class Customer : BaseEntity
{
    public Customer()
    {
        Id = SequentialGuidGenerator.Create();
    }

    public Guid Id { get; set; }
    public string PhoneNumber { get; set; } = null!;
    public string? Email { get; set; }
    public DateTime CreatedAt { get; set; }

    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}

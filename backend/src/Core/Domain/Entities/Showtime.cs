using System;
using System.Collections.Generic;
using NatureMiniPlex.Core.Domain.Common;
using NatureMiniPlex.Core.Domain.Events;

namespace NatureMiniPlex.Core.Domain.Entities;

public class Showtime : BaseEntity
{
    public int Id { get; set; }
    public int CinemaId { get; set; }
    public int MovieId { get; set; }
    public DateTime ShowDateTime { get; set; }
    public decimal TicketPrice { get; set; }
    public bool IsLocked { get; private set; }
    public bool IsActive { get; set; }
    public byte[] RowVersion { get; set; } = null!;

    public Cinema Cinema { get; set; } = null!;
    public Movie Movie { get; set; } = null!;
    public ICollection<BookingItem> BookingItems { get; set; } = new List<BookingItem>();

    public void LockShowtime()
    {
        if (IsLocked) return;
        
        IsLocked = true;
        AddDomainEvent(new ShowtimeLockedEvent(this));
    }

    public void EnsureCanBookOrCancel()
    {
        if (IsLocked)
        {
            throw new Exceptions.DomainException("Cannot process booking or cancellation. This showtime has been locked or started.");
        }

        if (DateTime.UtcNow >= ShowDateTime)
        {
            throw new Exceptions.DomainException("Cannot process booking or cancellation. Showtime has already started.");
        }
    }

    public void MarkAsStarted()
    {
        LockShowtime();
    }
}

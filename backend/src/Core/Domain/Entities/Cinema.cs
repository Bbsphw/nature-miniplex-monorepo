using System.Collections.Generic;
using NatureMiniPlex.Core.Domain.Common;

namespace NatureMiniPlex.Core.Domain.Entities;

public class Cinema : BaseEntity
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public int TotalSeats { get; set; }
    public bool IsActive { get; set; }

    public ICollection<Seat> Seats { get; set; } = new List<Seat>();
    public ICollection<Showtime> Showtimes { get; set; } = new List<Showtime>();
}

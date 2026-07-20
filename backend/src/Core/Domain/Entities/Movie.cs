using System;
using System.Collections.Generic;
using NatureMiniPlex.Core.Domain.Common;

namespace NatureMiniPlex.Core.Domain.Entities;

public class Movie : BaseEntity
{
    public int Id { get; set; }
    public string Title { get; set; } = null!;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal BasePrice { get; set; }
    public bool IsActive { get; set; }
    public byte[] RowVersion { get; set; } = null!;

    public ICollection<Showtime> Showtimes { get; set; } = new List<Showtime>();
}

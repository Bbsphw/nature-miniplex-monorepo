using System;

namespace NatureMiniPlex.Core.Application.DTOs;

public class ShowtimeDto
{
    public int Id { get; set; }
    public int MovieId { get; set; }
    public string MovieTitle { get; set; } = null!;
    public int CinemaId { get; set; }
    public string CinemaName { get; set; } = null!;
    public DateTime ShowDateTime { get; set; }
    public decimal TicketPrice { get; set; }
    public bool IsLocked { get; set; }
    public bool IsActive { get; set; }
}

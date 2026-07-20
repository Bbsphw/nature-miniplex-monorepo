namespace NatureMiniPlex.Core.Application.DTOs;

public class SeatStatusDto
{
    public int SeatId { get; set; }
    public string SeatName { get; set; } = null!; // e.g., A1
    public string RowName { get; set; } = null!;
    public string ColumnName { get; set; } = null!;
    public bool IsBooked { get; set; }
    public string? BookedByPhoneNumber { get; set; } // Null if not booked
}

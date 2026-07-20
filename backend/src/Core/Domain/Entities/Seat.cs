using NatureMiniPlex.Core.Domain.Common;

namespace NatureMiniPlex.Core.Domain.Entities;

public class Seat : BaseEntity
{
    public int Id { get; set; }
    public int CinemaId { get; set; }
    public string RowName { get; set; } = null!;
    public string ColumnName { get; set; } = null!;

    public Cinema Cinema { get; set; } = null!;
}

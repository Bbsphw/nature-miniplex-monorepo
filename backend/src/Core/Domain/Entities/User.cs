using System.Collections.Generic;
using NatureMiniPlex.Core.Domain.Common;

namespace NatureMiniPlex.Core.Domain.Entities;

public class User : BaseEntity
{
    public int Id { get; set; }
    public string Username { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public string? Email { get; set; }
    public int? CinemaId { get; set; }
    public bool IsActive { get; set; } = true;

    public Cinema? Cinema { get; set; }
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public ICollection<ActionLog> ActionLogs { get; set; } = new List<ActionLog>();
}

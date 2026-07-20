using System.Collections.Generic;
using NatureMiniPlex.Core.Domain.Common;
using NatureMiniPlex.Core.Domain.Enums;

namespace NatureMiniPlex.Core.Domain.Entities;

public class User : BaseEntity
{
    public int Id { get; set; }
    public string Username { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public UserRole Role { get; set; }
    public bool IsActive { get; set; }
    
    public ICollection<ActionLog> ActionLogs { get; set; } = new List<ActionLog>();
}

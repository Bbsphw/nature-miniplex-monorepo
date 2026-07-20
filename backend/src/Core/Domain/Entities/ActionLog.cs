using System;
using NatureMiniPlex.Core.Domain.Common;

namespace NatureMiniPlex.Core.Domain.Entities;

public class ActionLog : BaseEntity
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string ActionType { get; set; } = null!;
    public string EntityName { get; set; } = null!;
    public int EntityId { get; set; }
    public DateTime Timestamp { get; set; }

    public User User { get; set; } = null!;
}

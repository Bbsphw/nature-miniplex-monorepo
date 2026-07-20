using NatureMiniPlex.Core.Domain.Common;
using NatureMiniPlex.Core.Domain.Entities;

namespace NatureMiniPlex.Core.Domain.Events;

public class ShowtimeLockedEvent : IDomainEvent
{
    public Showtime Showtime { get; }

    public ShowtimeLockedEvent(Showtime showtime)
    {
        Showtime = showtime;
    }
}

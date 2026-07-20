using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using NatureMiniPlex.Core.Domain.Entities;
using NatureMiniPlex.Core.Domain.Events;
using NatureMiniPlex.Infrastructure.Persistence;

namespace NatureMiniPlex.Infrastructure.Services.EventHandlers;

public class ShowtimeLockedEventHandler : INotificationHandler<ShowtimeLockedEvent>
{
    private readonly ApplicationDbContext _dbContext;

    public ShowtimeLockedEventHandler(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task Handle(ShowtimeLockedEvent notification, CancellationToken cancellationToken)
    {
        var actionLog = new ActionLog
        {
            UserId = 1, // Assume system or context user
            ActionType = "ShowtimeLocked",
            EntityName = nameof(Showtime),
            EntityId = notification.Showtime.Id,
            Timestamp = DateTime.UtcNow
        };

        _dbContext.ActionLogs.Add(actionLog);
        
        // Assuming we don't want to call SaveChanges here to avoid infinite loops,
        // it will be saved as part of the current transaction that raised the event
        return Task.CompletedTask;
    }
}

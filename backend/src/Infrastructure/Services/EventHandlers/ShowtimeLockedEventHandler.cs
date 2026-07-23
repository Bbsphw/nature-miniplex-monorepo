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
            LogLevel = "INFO",
            UserId = 1, // System background event
            ActionName = "SHOWTIME_LOCKED",
            HttpMethod = "SYSTEM",
            TargetType = "TABLE: showtimes",
            TargetId = notification.Showtime.Id.ToString(),
            Timestamp = DateTime.UtcNow
        };

        _dbContext.ActionLogs.Add(actionLog);
        
        return Task.CompletedTask;
    }
}

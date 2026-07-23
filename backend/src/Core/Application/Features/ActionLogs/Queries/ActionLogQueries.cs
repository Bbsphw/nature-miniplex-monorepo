using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using NatureMiniPlex.Core.Domain.Entities;
using NatureMiniPlex.Infrastructure.Persistence;

namespace NatureMiniPlex.Core.Application.Features.ActionLogs.Queries;

public record GetActionLogsQuery : IRequest<IReadOnlyList<ActionLog>>;

public class GetActionLogsQueryHandler : IRequestHandler<GetActionLogsQuery, IReadOnlyList<ActionLog>>
{
    private readonly ApplicationDbContext _dbContext;

    public GetActionLogsQueryHandler(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<ActionLog>> Handle(GetActionLogsQuery request, CancellationToken cancellationToken)
    {
        return await _dbContext.ActionLogs
            .Include(a => a.User)
            .OrderByDescending(a => a.Timestamp)
            .ToListAsync(cancellationToken);
    }
}

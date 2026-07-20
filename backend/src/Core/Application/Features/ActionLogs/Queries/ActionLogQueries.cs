using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using NatureMiniPlex.Core.Application.Interfaces.Repositories;
using NatureMiniPlex.Core.Domain.Entities;

namespace NatureMiniPlex.Core.Application.Features.ActionLogs.Queries;

public record GetActionLogsQuery : IRequest<IReadOnlyList<ActionLog>>;

public class GetActionLogsQueryHandler : IRequestHandler<GetActionLogsQuery, IReadOnlyList<ActionLog>>
{
    private readonly IRepository<ActionLog> _actionLogRepository;

    public GetActionLogsQueryHandler(IRepository<ActionLog> actionLogRepository)
    {
        _actionLogRepository = actionLogRepository;
    }

    public async Task<IReadOnlyList<ActionLog>> Handle(GetActionLogsQuery request, CancellationToken cancellationToken)
    {
        return await _actionLogRepository.GetAllAsync(cancellationToken);
    }
}

using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using NatureMiniPlex.Core.Application.Interfaces;
using NatureMiniPlex.Core.Domain.Entities;

namespace NatureMiniPlex.Core.Application.Features.ActionLogs.Queries;

public record GetActionLogsQuery(int Page = 1, int PageSize = 50) : IRequest<IReadOnlyList<ActionLog>>;

public class GetActionLogsQueryHandler : IRequestHandler<GetActionLogsQuery, IReadOnlyList<ActionLog>>
{
    private readonly IActionLogRepository _actionLogRepository;

    public GetActionLogsQueryHandler(IActionLogRepository actionLogRepository)
    {
        _actionLogRepository = actionLogRepository;
    }

    public async Task<IReadOnlyList<ActionLog>> Handle(GetActionLogsQuery request, CancellationToken cancellationToken)
    {
        return await _actionLogRepository.GetLogsAsync(request.Page, request.PageSize, cancellationToken);
    }
}

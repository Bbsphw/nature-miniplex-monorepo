using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Moq;
using NatureMiniPlex.Application.UnitTests.Common;
using NatureMiniPlex.Core.Application.Features.ActionLogs.Queries;
using NatureMiniPlex.Core.Application.Interfaces;
using NatureMiniPlex.Core.Domain.Entities;
using Xunit;

namespace NatureMiniPlex.Application.UnitTests.ActionLogs.Queries;

public class ActionLogQueriesTests : BaseTest
{
    private readonly Mock<IActionLogRepository> _mockActionLogRepo;

    public ActionLogQueriesTests()
    {
        _mockActionLogRepo = new Mock<IActionLogRepository>();
    }

    [Fact]
    public async Task GetActionLogsQueryHandler_ShouldReturnAllActionLogs()
    {
        // Arrange
        var logs = new List<ActionLog> { new ActionLog { Id = 1 }, new ActionLog { Id = 2 } };
        _mockActionLogRepo.Setup(x => x.GetLogsAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>())).ReturnsAsync(logs);
        var handler = new GetActionLogsQueryHandler(_mockActionLogRepo.Object);

        // Act
        var result = await handler.Handle(new GetActionLogsQuery(), CancellationToken.None);

        // Assert
        result.Should().HaveCount(2);
    }
}

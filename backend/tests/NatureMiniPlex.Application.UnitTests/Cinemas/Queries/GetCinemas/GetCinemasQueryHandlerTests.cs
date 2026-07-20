using FluentAssertions;
using Moq;
using NatureMiniPlex.Application.UnitTests.Common;
using NatureMiniPlex.Core.Application.Features.Cinemas.Queries.GetCinemas;
using NatureMiniPlex.Core.Domain.Entities;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace NatureMiniPlex.Application.UnitTests.Cinemas.Queries.GetCinemas;

public class GetCinemasQueryHandlerTests : BaseTest
{
    private readonly GetCinemasQueryHandler _handler;
    private readonly Mock<NatureMiniPlex.Core.Application.Interfaces.Repositories.ICinemaRepository> _mockCinemaRepo;

    public GetCinemasQueryHandlerTests()
    {
        _mockCinemaRepo = new Mock<NatureMiniPlex.Core.Application.Interfaces.Repositories.ICinemaRepository>();
        _handler = new GetCinemasQueryHandler(_mockCinemaRepo.Object);
    }

    [Fact]
    public async Task Handle_ShouldReturnOnlyActiveCinemas()
    {
        // Arrange
        var cinemas = new List<Cinema>
        {
            new Cinema { Id = 1, Name = "Cinema 1", IsActive = true },
            new Cinema { Id = 2, Name = "Cinema 2", IsActive = false },
            new Cinema { Id = 3, Name = "Cinema 3", IsActive = true }
        };
        _mockCinemaRepo.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>()))
                       .ReturnsAsync(cinemas);

        var query = new GetCinemasQuery();

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(2);
        result.Should().Contain(c => c.Id == 1);
        result.Should().Contain(c => c.Id == 3);
    }
}

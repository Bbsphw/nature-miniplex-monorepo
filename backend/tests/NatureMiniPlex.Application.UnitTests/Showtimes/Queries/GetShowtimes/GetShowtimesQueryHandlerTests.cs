using FluentAssertions;
using Moq;
using NatureMiniPlex.Application.UnitTests.Common;
using NatureMiniPlex.Core.Application.Features.Showtimes.Queries.GetShowtimes;
using NatureMiniPlex.Core.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace NatureMiniPlex.Application.UnitTests.Showtimes.Queries.GetShowtimes;

public class GetShowtimesQueryHandlerTests : BaseTest
{
    private readonly GetShowtimesQueryHandler _handler;

    public GetShowtimesQueryHandlerTests()
    {
        _handler = new GetShowtimesQueryHandler(MockShowtimeRepository.Object);
    }

    [Fact]
    public async Task Handle_ShouldReturnOnlyActiveShowtimes()
    {
        // Arrange
        var showtimes = new List<Showtime>
        {
            new Showtime { Id = 1, IsActive = true },
            new Showtime { Id = 2, IsActive = false },
            new Showtime { Id = 3, IsActive = true }
        };
        MockShowtimeRepository.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>()))
                              .ReturnsAsync(showtimes);

        var query = new GetShowtimesQuery(null, null, null);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(2);
        result.Should().Contain(s => s.Id == 1);
        result.Should().Contain(s => s.Id == 3);
    }

    [Fact]
    public async Task Handle_ShouldFilterByMovieId_WhenMovieIdIsProvided()
    {
        // Arrange
        var showtimes = new List<Showtime>
        {
            new Showtime { Id = 1, MovieId = 10, IsActive = true },
            new Showtime { Id = 2, MovieId = 20, IsActive = true }
        };
        MockShowtimeRepository.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>()))
                              .ReturnsAsync(showtimes);

        var query = new GetShowtimesQuery(MovieId: 10, null, null);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(1);
        result.First().Id.Should().Be(1);
    }
}

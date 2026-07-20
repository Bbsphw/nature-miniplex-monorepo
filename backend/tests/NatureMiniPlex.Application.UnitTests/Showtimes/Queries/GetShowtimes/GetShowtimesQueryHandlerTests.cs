using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Moq;
using NatureMiniPlex.Application.UnitTests.Common;
using NatureMiniPlex.Core.Application.Features.Showtimes.Queries.GetShowtimes;
using NatureMiniPlex.Core.Application.DTOs;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace NatureMiniPlex.Application.UnitTests.Showtimes.Queries.GetShowtimes;

public class GetShowtimesQueryHandlerTests : BaseTest
{
    private readonly IMemoryCache _cache;
    private readonly GetShowtimesQueryHandler _handler;

    public GetShowtimesQueryHandlerTests()
    {
        _cache = new MemoryCache(new MemoryCacheOptions());
        _handler = new GetShowtimesQueryHandler(MockShowtimeRepository.Object, _cache);
    }

    [Fact]
    public async Task Handle_ShouldReturnShowtimesFromRepository_AndCacheThem()
    {
        // Arrange
        var showtimes = new List<ShowtimeDto>
        {
            new ShowtimeDto { Id = 1, MovieId = 10, IsActive = true },
            new ShowtimeDto { Id = 2, MovieId = 10, IsActive = true }
        };
        
        MockShowtimeRepository.Setup(x => x.GetPagedShowtimesAsync(It.IsAny<int?>(), It.IsAny<int?>(), It.IsAny<DateTime?>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
                              .ReturnsAsync(showtimes);

        var query = new GetShowtimesQuery(MovieId: 10, null, null);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(2);
        MockShowtimeRepository.Verify(x => x.GetPagedShowtimesAsync(10, null, null, 1, 20, It.IsAny<CancellationToken>()), Times.Once);
        
        // Act again to test cache
        var result2 = await _handler.Handle(query, CancellationToken.None);
        
        // Assert cache was used (repository should not be called again)
        result2.Should().HaveCount(2);
        MockShowtimeRepository.Verify(x => x.GetPagedShowtimesAsync(10, null, null, 1, 20, It.IsAny<CancellationToken>()), Times.Once);
    }
}

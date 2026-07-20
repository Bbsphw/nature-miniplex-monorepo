using FluentAssertions;
using Moq;
using NatureMiniPlex.Application.UnitTests.Common;
using NatureMiniPlex.Core.Application.Features.Movies.Queries.GetMovieById;
using NatureMiniPlex.Core.Domain.Entities;
using System;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace NatureMiniPlex.Application.UnitTests.Movies.Queries.GetMovieById;

public class GetMovieByIdQueryHandlerTests : BaseTest
{
    private readonly GetMovieByIdQueryHandler _handler;

    public GetMovieByIdQueryHandlerTests()
    {
        _handler = new GetMovieByIdQueryHandler(MockMovieRepository.Object);
    }

    [Fact]
    public async Task Handle_ShouldReturnMovie_WhenExists()
    {
        // Arrange
        var movie = new Movie { Id = 1, Title = "Movie 1", IsActive = true };
        MockMovieRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                           .ReturnsAsync(movie);

        var query = new GetMovieByIdQuery(1);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(1);
    }

    [Fact]
    public async Task Handle_ShouldThrowException_WhenMovieNotFound()
    {
        // Arrange
        MockMovieRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                           .ReturnsAsync((Movie?)null);

        var query = new GetMovieByIdQuery(1);

        // Act
        Func<Task> act = async () => await _handler.Handle(query, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<Exception>().WithMessage("Movie with ID 1 not found.");
    }
}

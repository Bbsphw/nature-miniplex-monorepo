using FluentAssertions;
using Moq;
using NatureMiniPlex.Application.UnitTests.Common;
using NatureMiniPlex.Core.Application.Features.Movies.Queries.GetMovies;
using NatureMiniPlex.Core.Domain.Entities;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace NatureMiniPlex.Application.UnitTests.Movies.Queries.GetMovies;

public class GetMoviesQueryHandlerTests : BaseTest
{
    private readonly GetMoviesQueryHandler _handler;

    public GetMoviesQueryHandlerTests()
    {
        _handler = new GetMoviesQueryHandler(MockMovieRepository.Object);
    }

    [Fact]
    public async Task Handle_ShouldReturnOnlyActiveMovies()
    {
        // Arrange
        var movies = new List<Movie>
        {
            new Movie { Id = 1, Title = "Movie 1", IsActive = true },
            new Movie { Id = 2, Title = "Movie 2", IsActive = false },
            new Movie { Id = 3, Title = "Movie 3", IsActive = true }
        };
        MockMovieRepository.Setup(x => x.GetActiveMoviesAsync(It.IsAny<CancellationToken>()))
                           .ReturnsAsync(movies.Where(m => m.IsActive).ToList());

        var query = new GetMoviesQuery();

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(2);
        result.Should().Contain(m => m.Id == 1);
        result.Should().Contain(m => m.Id == 3);
    }
}

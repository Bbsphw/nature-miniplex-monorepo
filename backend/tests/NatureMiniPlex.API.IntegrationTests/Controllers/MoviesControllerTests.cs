using System.Net;
using System.Net.Http.Json;
using System.Threading.Tasks;
using NatureMiniPlex.Core.Application.Features.Movies.Commands.CreateMovie;
using Xunit;

namespace NatureMiniPlex.API.IntegrationTests.Controllers;

public class MoviesControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public MoviesControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task CreateMovie_ShouldReturnUnauthorized_WhenNoTokenIsProvided()
    {
        // Arrange
        var client = _factory.CreateClient();
        var command = new CreateMovieCommand("Inception", System.DateTime.UtcNow, System.DateTime.UtcNow.AddMonths(1), 150m, true);

        // Act
        var response = await client.PostAsJsonAsync("/api/movies", command);

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}

using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using System.Threading.Tasks;
using Xunit;

namespace NatureMiniPlex.API.IntegrationTests.Controllers;

public class HealthCheckTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public HealthCheckTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task SwaggerEndpoint_ShouldReturnSuccess_WhenApplicationStarts()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        // Assuming Swagger is available in Testing environment, or we test a known endpoint
        // Since we don't have a specific HealthCheck configured, we'll try to fetch Swagger JSON
        var response = await client.GetAsync("/swagger/v1/swagger.json");

        // Assert
        response.EnsureSuccessStatusCode(); // Status Code 200-299
        response.Content.Headers.ContentType?.ToString().Should().Contain("application/json");
    }
}

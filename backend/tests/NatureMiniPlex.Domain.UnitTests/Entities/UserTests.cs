using NatureMiniPlex.Core.Domain.Entities;
using Xunit;

namespace NatureMiniPlex.Domain.UnitTests.Entities;

public class UserTests
{
    [Fact]
    public void Constructor_ShouldInitializeProperties()
    {
        // Act
        var user = new User
        {
            Id = 1,
            Username = "admin@example.com",
            PasswordHash = "hashed_password",
            Email = "admin@example.com",
            CinemaId = 2,
            IsActive = true
        };

        // Assert
        Assert.Equal("admin@example.com", user.Username);
        Assert.Equal("hashed_password", user.PasswordHash);
        Assert.Equal("admin@example.com", user.Email);
        Assert.Equal(2, user.CinemaId);
        Assert.True(user.IsActive);
        Assert.NotNull(user.UserRoles);
        Assert.NotNull(user.ActionLogs);
    }
}

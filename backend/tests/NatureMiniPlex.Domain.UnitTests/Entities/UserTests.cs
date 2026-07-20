using NatureMiniPlex.Core.Domain.Entities;
using NatureMiniPlex.Core.Domain.Enums;
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
            Role = UserRole.Owner,
            IsActive = true
        };

        // Assert
        Assert.Equal("admin@example.com", user.Username);
        Assert.Equal("hashed_password", user.PasswordHash);
        Assert.Equal(UserRole.Owner, user.Role);
        Assert.True(user.IsActive);
    }
}

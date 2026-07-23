using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Moq;
using NatureMiniPlex.Core.Application.DTOs.Auth;
using NatureMiniPlex.Core.Application.Features.Auth.Commands;
using NatureMiniPlex.Core.Application.Interfaces;
using NatureMiniPlex.Core.Application.Interfaces.Repositories;
using NatureMiniPlex.Core.Domain.Entities;
using Xunit;

namespace NatureMiniPlex.Application.UnitTests.Auth;

public class AuthCommandsTests
{
    private readonly Mock<IRepository<User>> _mockUserRepository;
    private readonly Mock<IRepository<UserRole>> _mockUserRoleRepository;
    private readonly Mock<IRepository<Role>> _mockRoleRepository;
    private readonly Mock<IPasswordHasher> _mockPasswordHasher;
    private readonly Mock<IJwtTokenGenerator> _mockJwtTokenGenerator;
    private readonly Mock<IPermissionService> _mockPermissionService;

    public AuthCommandsTests()
    {
        _mockUserRepository = new Mock<IRepository<User>>();
        _mockUserRoleRepository = new Mock<IRepository<UserRole>>();
        _mockRoleRepository = new Mock<IRepository<Role>>();
        _mockPasswordHasher = new Mock<IPasswordHasher>();
        _mockJwtTokenGenerator = new Mock<IJwtTokenGenerator>();
        _mockPermissionService = new Mock<IPermissionService>();

        _mockUserRoleRepository.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<UserRole>());
        _mockRoleRepository.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Role>());
    }

    [Fact]
    public async Task SignInCommandHandler_ShouldReturnToken_WhenCredentialsAreValid()
    {
        // Arrange
        var user = new User { Id = 1, Username = "test@test.com", PasswordHash = "hash", IsActive = true };
        _mockUserRepository.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<User> { user });
            
        _mockPasswordHasher.Setup(x => x.Verify("password", "hash")).Returns(true);
        _mockJwtTokenGenerator.Setup(x => x.GenerateToken(user)).Returns("valid_token");
        _mockPermissionService.Setup(x => x.GetUserPermissionsAsync(user.Id))
            .ReturnsAsync(new HashSet<string> { "bookings:read:own" });

        var handler = new SignInCommandHandler(
            _mockUserRepository.Object,
            _mockUserRoleRepository.Object,
            _mockRoleRepository.Object,
            _mockPasswordHasher.Object,
            _mockJwtTokenGenerator.Object,
            _mockPermissionService.Object);

        var command = new SignInCommand(new SignInRequestDto { Username = "test@test.com", Password = "password" });

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("valid_token", result.AccessToken);
        Assert.Equal("test@test.com", result.Username);
        Assert.Contains("bookings:read:own", result.Permissions);
    }

    [Fact]
    public async Task SignInCommandHandler_ShouldThrowException_WhenPasswordIsInvalid()
    {
        // Arrange
        var user = new User { Id = 1, Username = "test@test.com", PasswordHash = "hash" };
        _mockUserRepository.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<User> { user });
            
        _mockPasswordHasher.Setup(x => x.Verify("wrong", "hash")).Returns(false);

        var handler = new SignInCommandHandler(
            _mockUserRepository.Object,
            _mockUserRoleRepository.Object,
            _mockRoleRepository.Object,
            _mockPasswordHasher.Object,
            _mockJwtTokenGenerator.Object,
            _mockPermissionService.Object);

        var command = new SignInCommand(new SignInRequestDto { Username = "test@test.com", Password = "wrong" });

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(command, CancellationToken.None));
    }
}

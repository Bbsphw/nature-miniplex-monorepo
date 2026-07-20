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
using NatureMiniPlex.Core.Domain.Enums;
using Xunit;

namespace NatureMiniPlex.Application.UnitTests.Auth;

public class AuthCommandsTests
{
    private readonly Mock<IRepository<User>> _mockUserRepository;
    private readonly Mock<IPasswordHasher> _mockPasswordHasher;
    private readonly Mock<IJwtTokenGenerator> _mockJwtTokenGenerator;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;

    public AuthCommandsTests()
    {
        _mockUserRepository = new Mock<IRepository<User>>();
        _mockPasswordHasher = new Mock<IPasswordHasher>();
        _mockJwtTokenGenerator = new Mock<IJwtTokenGenerator>();
        _mockUnitOfWork = new Mock<IUnitOfWork>();
    }

    [Fact]
    public async Task SignInCommandHandler_ShouldReturnToken_WhenCredentialsAreValid()
    {
        // Arrange
        var user = new User { Id = 1, Username = "test@test.com", PasswordHash = "hash", Role = UserRole.Owner, IsActive = true };
        _mockUserRepository.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<User> { user });
            
        _mockPasswordHasher.Setup(x => x.Verify("password", "hash")).Returns(true);
        _mockJwtTokenGenerator.Setup(x => x.GenerateToken(user)).Returns("valid_token");

        var handler = new SignInCommandHandler(_mockUserRepository.Object, _mockPasswordHasher.Object, _mockJwtTokenGenerator.Object);
        var command = new SignInCommand(new SignInRequestDto { Username = "test@test.com", Password = "password" });

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("valid_token", result.AccessToken);
        Assert.Equal("test@test.com", result.Username);
    }

    [Fact]
    public async Task SignInCommandHandler_ShouldThrowException_WhenPasswordIsInvalid()
    {
        // Arrange
        var user = new User { Id = 1, Username = "test@test.com", PasswordHash = "hash" };
        _mockUserRepository.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<User> { user });
            
        _mockPasswordHasher.Setup(x => x.Verify("wrong", "hash")).Returns(false);

        var handler = new SignInCommandHandler(_mockUserRepository.Object, _mockPasswordHasher.Object, _mockJwtTokenGenerator.Object);
        var command = new SignInCommand(new SignInRequestDto { Username = "test@test.com", Password = "wrong" });

        // Act & Assert
        await Assert.ThrowsAsync<Exception>(() => handler.Handle(command, CancellationToken.None));
    }

}

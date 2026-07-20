using FluentAssertions;
using Moq;
using NatureMiniPlex.Application.UnitTests.Common;
using NatureMiniPlex.Core.Application.Features.Users.Queries;
using NatureMiniPlex.Core.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace NatureMiniPlex.Application.UnitTests.Users.Queries;

public class UserQueriesTests : BaseTest
{
    private readonly Mock<NatureMiniPlex.Core.Application.Interfaces.Repositories.IRepository<User>> _mockUserRepo;

    public UserQueriesTests()
    {
        _mockUserRepo = new Mock<NatureMiniPlex.Core.Application.Interfaces.Repositories.IRepository<User>>();
    }

    [Fact]
    public async Task GetUsersQueryHandler_ShouldReturnAllUsers()
    {
        // Arrange
        var users = new List<User> { new User { Id = 1 }, new User { Id = 2 } };
        _mockUserRepo.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(users);
        var handler = new GetUsersQueryHandler(_mockUserRepo.Object);

        // Act
        var result = await handler.Handle(new GetUsersQuery(), CancellationToken.None);

        // Assert
        result.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetUserByIdQueryHandler_ShouldReturnUser_WhenExists()
    {
        // Arrange
        _mockUserRepo.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(new User { Id = 1 });
        var handler = new GetUserByIdQueryHandler(_mockUserRepo.Object);

        // Act
        var result = await handler.Handle(new GetUserByIdQuery(1), CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(1);
    }
    
    [Fact]
    public async Task GetUserByIdQueryHandler_ShouldThrowException_WhenUserNotFound()
    {
        // Arrange
        _mockUserRepo.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync((User?)null);
        var handler = new GetUserByIdQueryHandler(_mockUserRepo.Object);

        // Act
        Func<Task> act = async () => await handler.Handle(new GetUserByIdQuery(1), CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<Exception>().WithMessage("User not found.");
    }
}

using FluentAssertions;
using Moq;
using NatureMiniPlex.Application.UnitTests.Common;
using NatureMiniPlex.Core.Application.Features.Users.Commands;
using NatureMiniPlex.Core.Application.Interfaces;
using NatureMiniPlex.Core.Application.Interfaces.Repositories;
using NatureMiniPlex.Core.Domain.Entities;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace NatureMiniPlex.Application.UnitTests.Users.Commands;

public class CreateUserCommandHandlerTests : BaseTest
{
    private readonly CreateUserCommandHandler _handler;
    private readonly Mock<IRepository<User>> _mockUserRepo;
    private readonly Mock<IRepository<Role>> _mockRoleRepo;
    private readonly Mock<IPasswordHasher> _mockPasswordHasher;

    public CreateUserCommandHandlerTests()
    {
        _mockUserRepo = new Mock<IRepository<User>>();
        _mockRoleRepo = new Mock<IRepository<Role>>();
        _mockPasswordHasher = new Mock<IPasswordHasher>();
        _mockPasswordHasher.Setup(x => x.Hash(It.IsAny<string>())).Returns("hashed_password");
        
        _mockRoleRepo.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Role> { new Role { Id = 1, Code = "SYSTEM_ADMIN", Name = "Admin" } });

        _handler = new CreateUserCommandHandler(
            _mockUserRepo.Object,
            _mockRoleRepo.Object,
            MockUnitOfWork.Object,
            _mockPasswordHasher.Object);
    }

    [Fact]
    public async Task Handle_ShouldAddUserAndSaveChanges()
    {
        // Arrange
        var command = new CreateUserCommand("testuser", "hash", "SYSTEM_ADMIN");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        _mockUserRepo.Verify(x => x.AddAsync(It.Is<User>(u => 
            u.Username == "testuser" &&
            u.PasswordHash == "hashed_password" &&
            u.IsActive == true
        ), It.IsAny<CancellationToken>()), Times.Once);

        MockUnitOfWork.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.AtLeastOnce);
    }
}

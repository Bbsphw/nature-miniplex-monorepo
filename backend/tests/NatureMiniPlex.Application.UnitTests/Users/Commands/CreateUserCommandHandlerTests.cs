using FluentAssertions;
using Moq;
using NatureMiniPlex.Application.UnitTests.Common;
using NatureMiniPlex.Core.Application.Features.Users.Commands;
using NatureMiniPlex.Core.Domain.Entities;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace NatureMiniPlex.Application.UnitTests.Users.Commands;

public class CreateUserCommandHandlerTests : BaseTest
{
    private readonly CreateUserCommandHandler _handler;
    private readonly Mock<NatureMiniPlex.Core.Application.Interfaces.Repositories.IRepository<User>> _mockUserRepo;
    private readonly Mock<NatureMiniPlex.Core.Application.Interfaces.IPasswordHasher> _mockPasswordHasher;

    public CreateUserCommandHandlerTests()
    {
        _mockUserRepo = new Mock<NatureMiniPlex.Core.Application.Interfaces.Repositories.IRepository<User>>();
        _mockPasswordHasher = new Mock<NatureMiniPlex.Core.Application.Interfaces.IPasswordHasher>();
        _mockPasswordHasher.Setup(x => x.Hash(It.IsAny<string>())).Returns("hashed_password");
        _handler = new CreateUserCommandHandler(_mockUserRepo.Object, MockUnitOfWork.Object, _mockPasswordHasher.Object);
    }

    [Fact]
    public async Task Handle_ShouldAddUserAndSaveChanges()
    {
        // Arrange
        var command = new CreateUserCommand("testuser", "hash", "Owner");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        _mockUserRepo.Verify(x => x.AddAsync(It.Is<User>(u => 
            u.Username == "testuser" &&
            u.PasswordHash == "hashed_password" &&
            u.Role == NatureMiniPlex.Core.Domain.Enums.UserRole.Owner &&
            u.IsActive == true
        ), It.IsAny<CancellationToken>()), Times.Once);

        MockUnitOfWork.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}

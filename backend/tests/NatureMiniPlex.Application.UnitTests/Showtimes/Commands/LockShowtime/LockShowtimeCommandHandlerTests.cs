using FluentAssertions;
using Moq;
using NatureMiniPlex.Application.UnitTests.Common;
using NatureMiniPlex.Core.Application.Features.Showtimes.Commands.LockShowtime;
using NatureMiniPlex.Core.Domain.Entities;
using System;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace NatureMiniPlex.Application.UnitTests.Showtimes.Commands.LockShowtime;

public class LockShowtimeCommandHandlerTests : BaseTest
{
    private readonly LockShowtimeCommandHandler _handler;

    public LockShowtimeCommandHandlerTests()
    {
        _handler = new LockShowtimeCommandHandler(MockShowtimeRepository.Object, MockUnitOfWork.Object);
    }

    [Fact]
    public async Task Handle_ShouldLockShowtime_WhenShowtimeExistsAndNotLocked()
    {
        // Arrange
        var existingShowtime = new Showtime { Id = 1, IsActive = true };
        MockShowtimeRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                              .ReturnsAsync(existingShowtime);

        var command = new LockShowtimeCommand(1);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeTrue();
        existingShowtime.IsLocked.Should().BeTrue();
        MockUnitOfWork.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldReturnTrueAndNotSaveChanges_WhenShowtimeIsAlreadyLocked()
    {
        // Arrange
        var existingShowtime = new Showtime { Id = 1, IsActive = true };
        existingShowtime.LockShowtime();
        MockShowtimeRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                              .ReturnsAsync(existingShowtime);

        var command = new LockShowtimeCommand(1);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeTrue();
        MockUnitOfWork.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }
    
    [Fact]
    public async Task Handle_ShouldThrowException_WhenShowtimeDoesNotExist()
    {
        // Arrange
        MockShowtimeRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                              .ReturnsAsync((Showtime?)null);

        var command = new LockShowtimeCommand(1);

        // Act
        Func<Task> act = async () => await _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<Exception>().WithMessage("Showtime not found.");
    }
}


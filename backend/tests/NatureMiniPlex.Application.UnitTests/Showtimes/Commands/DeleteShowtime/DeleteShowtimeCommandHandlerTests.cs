using FluentAssertions;
using Moq;
using NatureMiniPlex.Application.UnitTests.Common;
using NatureMiniPlex.Core.Application.Features.Showtimes.Commands.DeleteShowtime;
using NatureMiniPlex.Core.Domain.Entities;
using System;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace NatureMiniPlex.Application.UnitTests.Showtimes.Commands.DeleteShowtime;

public class DeleteShowtimeCommandHandlerTests : BaseTest
{
    private readonly DeleteShowtimeCommandHandler _handler;

    public DeleteShowtimeCommandHandlerTests()
    {
        _handler = new DeleteShowtimeCommandHandler(MockShowtimeRepository.Object, MockUnitOfWork.Object);
    }

    [Fact]
    public async Task Handle_ShouldSoftDeleteShowtime_WhenShowtimeExists()
    {
        // Arrange
        var existingShowtime = new Showtime { Id = 1, IsActive = true };
        MockShowtimeRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                              .ReturnsAsync(existingShowtime);

        var command = new DeleteShowtimeCommand(1);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        MockShowtimeRepository.Verify(x => x.UpdateAsync(It.Is<Showtime>(s => 
            s.Id == 1 &&
            s.IsActive == false
        ), It.IsAny<CancellationToken>()), Times.Once);

        MockUnitOfWork.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
    
    [Fact]
    public async Task Handle_ShouldThrowException_WhenShowtimeDoesNotExist()
    {
        // Arrange
        MockShowtimeRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                              .ReturnsAsync((Showtime?)null);

        var command = new DeleteShowtimeCommand(1);

        // Act
        Func<Task> act = async () => await _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<Exception>().WithMessage("Showtime not found.");
    }
}

using FluentAssertions;
using Moq;
using NatureMiniPlex.Application.UnitTests.Common;
using NatureMiniPlex.Core.Application.Features.Showtimes.Commands.UpdateShowtime;
using NatureMiniPlex.Core.Domain.Entities;
using System;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace NatureMiniPlex.Application.UnitTests.Showtimes.Commands.UpdateShowtime;

public class UpdateShowtimeCommandHandlerTests : BaseTest
{
    private readonly UpdateShowtimeCommandHandler _handler;

    public UpdateShowtimeCommandHandlerTests()
    {
        _handler = new UpdateShowtimeCommandHandler(MockShowtimeRepository.Object, MockUnitOfWork.Object);
    }

    [Fact]
    public async Task Handle_ShouldUpdateShowtimeAndSaveChanges_WhenShowtimeExists()
    {
        // Arrange
        var existingShowtime = new Showtime { Id = 1, CinemaId = 1, MovieId = 1 };
        MockShowtimeRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                              .ReturnsAsync(existingShowtime);

        var command = new UpdateShowtimeCommand(1, 2, 3, DateTime.UtcNow.AddDays(2), 300m, false);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        MockShowtimeRepository.Verify(x => x.UpdateAsync(It.Is<Showtime>(s => 
            s.Id == 1 &&
            s.CinemaId == command.CinemaId &&
            s.MovieId == command.MovieId &&
            s.TicketPrice == command.TicketPrice &&
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

        var command = new UpdateShowtimeCommand(1, 2, 3, DateTime.UtcNow.AddDays(2), 300m, false);

        // Act
        Func<Task> act = async () => await _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<Exception>().WithMessage("Showtime not found.");
    }
}

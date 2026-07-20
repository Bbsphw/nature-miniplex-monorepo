using FluentAssertions;
using Moq;
using NatureMiniPlex.Application.UnitTests.Common;
using NatureMiniPlex.Core.Application.Features.Showtimes.Commands.CreateShowtime;
using NatureMiniPlex.Core.Domain.Entities;
using System;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace NatureMiniPlex.Application.UnitTests.Showtimes.Commands.CreateShowtime;

public class CreateShowtimeCommandHandlerTests : BaseTest
{
    private readonly CreateShowtimeCommandHandler _handler;

    public CreateShowtimeCommandHandlerTests()
    {
        _handler = new CreateShowtimeCommandHandler(MockShowtimeRepository.Object, MockUnitOfWork.Object);
    }

    [Fact]
    public async Task Handle_ShouldAddShowtimeAndSaveChanges()
    {
        // Arrange
        var command = new CreateShowtimeCommand(1, 2, DateTime.UtcNow.AddDays(1), 250m);
        
        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        MockShowtimeRepository.Verify(x => x.AddAsync(It.Is<Showtime>(s => 
            s.CinemaId == command.CinemaId &&
            s.MovieId == command.MovieId &&
            s.TicketPrice == command.TicketPrice &&
            s.IsActive == true
        ), It.IsAny<CancellationToken>()), Times.Once);

        MockUnitOfWork.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}

using FluentAssertions;
using Moq;
using NatureMiniPlex.Application.UnitTests.Common;
using NatureMiniPlex.Core.Application.Features.Movies.Commands.UpdateMovie;
using NatureMiniPlex.Core.Domain.Entities;
using System;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace NatureMiniPlex.Application.UnitTests.Movies.Commands.UpdateMovie;

public class UpdateMovieCommandHandlerTests : BaseTest
{
    private readonly UpdateMovieCommandHandler _handler;

    public UpdateMovieCommandHandlerTests()
    {
        _handler = new UpdateMovieCommandHandler(MockMovieRepository.Object, MockUnitOfWork.Object);
    }

    [Fact]
    public async Task Handle_ShouldUpdateMovie_WhenValidRequest()
    {
        // Arrange
        var existingMovie = new Movie { Id = 1, Title = "Old Title" };
        MockMovieRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                           .ReturnsAsync(existingMovie);

        var startDate = DateTime.UtcNow;
        var endDate = startDate.AddDays(30);
        var command = new UpdateMovieCommand(1, "New Title", startDate, endDate, 150m, true);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        MockMovieRepository.Verify(x => x.UpdateAsync(It.Is<Movie>(m => 
            m.Id == 1 &&
            m.Title == "New Title" &&
            m.BasePrice == 150m &&
            m.IsActive == true
        ), It.IsAny<CancellationToken>()), Times.Once);

        MockUnitOfWork.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldThrowException_WhenStartDateIsAfterEndDate()
    {
        // Arrange
        var existingMovie = new Movie { Id = 1 };
        MockMovieRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                           .ReturnsAsync(existingMovie);

        var startDate = DateTime.UtcNow.AddDays(10);
        var endDate = DateTime.UtcNow;
        var command = new UpdateMovieCommand(1, "New Title", startDate, endDate, 150m, true);

        // Act
        Func<Task> act = async () => await _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<Exception>().WithMessage("Start date cannot be after end date.");
    }
}

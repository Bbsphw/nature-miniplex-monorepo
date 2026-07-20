using FluentAssertions;
using Moq;
using NatureMiniPlex.Application.UnitTests.Common;
using NatureMiniPlex.Core.Application.Features.Movies.Commands.DeleteMovie;
using NatureMiniPlex.Core.Domain.Entities;
using System;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace NatureMiniPlex.Application.UnitTests.Movies.Commands.DeleteMovie;

public class DeleteMovieCommandHandlerTests : BaseTest
{
    private readonly DeleteMovieCommandHandler _handler;

    public DeleteMovieCommandHandlerTests()
    {
        _handler = new DeleteMovieCommandHandler(MockMovieRepository.Object, MockUnitOfWork.Object);
    }

    [Fact]
    public async Task Handle_ShouldSoftDeleteMovie_WhenMovieExists()
    {
        // Arrange
        var existingMovie = new Movie { Id = 1, IsActive = true };
        MockMovieRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                           .ReturnsAsync(existingMovie);

        var command = new DeleteMovieCommand(1);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        MockMovieRepository.Verify(x => x.UpdateAsync(It.Is<Movie>(m => 
            m.Id == 1 &&
            m.IsActive == false
        ), It.IsAny<CancellationToken>()), Times.Once);

        MockUnitOfWork.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}

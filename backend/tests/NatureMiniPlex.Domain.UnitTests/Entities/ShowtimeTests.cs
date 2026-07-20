using System;
using NatureMiniPlex.Core.Domain.Entities;
using Xunit;

namespace NatureMiniPlex.Domain.UnitTests.Entities;

public class ShowtimeTests
{
    [Fact]
    public void LockShowtime_ShouldSetIsLockedToTrue_WhenInitiallyFalse()
    {
        // Arrange
        var showtime = new Showtime
        {
            Id = 1,
            CinemaId = 1,
            MovieId = 1,
            ShowDateTime = DateTime.UtcNow.AddDays(1),
            TicketPrice = 150m,
            IsActive = true
        };

        // Act
        showtime.LockShowtime();

        // Assert
        Assert.True(showtime.IsLocked);
    }
}

using System;
using NatureMiniPlex.Core.Domain.Entities;
using NatureMiniPlex.Core.Domain.Enums;
using Xunit;

namespace NatureMiniPlex.Domain.UnitTests.Entities;

public class BookingTests
{
    [Fact]
    public void Constructor_ShouldInitializeProperties()
    {
        // Act
        var customerId = Guid.NewGuid();
        var booking = new Booking
        {
            CustomerId = customerId,
            BookingTime = DateTime.UtcNow,
            Status = BookingStatus.Completed
        };

        // Assert
        Assert.NotEqual(Guid.Empty, booking.Id);
        Assert.Equal(customerId, booking.CustomerId);
        Assert.Equal(BookingStatus.Completed, booking.Status);
        Assert.NotNull(booking.BookingItems);
    }
}

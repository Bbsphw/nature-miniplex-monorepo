using FluentAssertions;
using NatureMiniPlex.Core.Domain.Entities;
using NatureMiniPlex.Core.Domain.Enums;
using System;
using Xunit;

namespace NatureMiniPlex.Domain.UnitTests.Entities;

public class BookingItemTests
{
    [Fact]
    public void Constructor_ShouldInitializeWithNewGuid()
    {
        // Arrange & Act
        var bookingItem = new BookingItem();

        // Assert
        bookingItem.Id.Should().NotBeEmpty();
        bookingItem.Id.Should().NotBe(Guid.Empty);
    }

    [Fact]
    public void Properties_ShouldBeSettable()
    {
        // Arrange
        var bookingItem = new BookingItem();
        var bookingId = Guid.NewGuid();
        var rowVersion = new byte[] { 0x00, 0x00, 0x00, 0x01 };

        // Act
        bookingItem.BookingId = bookingId;
        bookingItem.ShowtimeId = 10;
        bookingItem.SeatId = 20;
        bookingItem.Price = 150.50m;
        bookingItem.ItemStatus = ItemStatus.Active;
        bookingItem.RowVersion = rowVersion;

        // Assert
        bookingItem.BookingId.Should().Be(bookingId);
        bookingItem.ShowtimeId.Should().Be(10);
        bookingItem.SeatId.Should().Be(20);
        bookingItem.Price.Should().Be(150.50m);
        bookingItem.ItemStatus.Should().Be(ItemStatus.Active);
        bookingItem.RowVersion.Should().BeEquivalentTo(rowVersion);
    }
}

using FluentAssertions;
using Moq;
using NatureMiniPlex.Application.UnitTests.Common;
using NatureMiniPlex.Core.Application.Features.Bookings.Commands.CancelBooking;
using NatureMiniPlex.Core.Domain.Entities;
using NatureMiniPlex.Core.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace NatureMiniPlex.Application.UnitTests.Bookings.Commands.CancelBooking;

public class CancelBookingCommandHandlerTests : BaseTest
{
    private readonly CancelBookingCommandHandler _handler;

    public CancelBookingCommandHandlerTests()
    {
        _handler = new CancelBookingCommandHandler(MockBookingRepository.Object, MockShowtimeRepository.Object, MockUnitOfWork.Object);
    }

    [Fact]
    public async Task Handle_ShouldCancelBooking_WhenValidRequest()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var booking = new Booking 
        { 
            Id = bookingId, 
            Customer = new Customer { PhoneNumber = "0812345678" },
            Status = BookingStatus.Completed
        };
        booking.BookingItems.Add(new BookingItem { ShowtimeId = 1, ItemStatus = ItemStatus.Active });

        MockBookingRepository.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>()))
                             .ReturnsAsync(new List<Booking> { booking });
                             
        MockShowtimeRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                              .ReturnsAsync(new Showtime { Id = 1, IsActive = true });

        var command = new CancelBookingCommand(bookingId, "0812345678");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeTrue();
        booking.Status.Should().Be(BookingStatus.Canceled);
        booking.BookingItems.Should().Contain(i => i.ItemStatus == ItemStatus.Canceled);
        MockUnitOfWork.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldThrowException_WhenPhoneNumberDoesNotMatch()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var booking = new Booking 
        { 
            Id = bookingId, 
            Customer = new Customer { PhoneNumber = "0812345678" }
        };

        MockBookingRepository.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>()))
                             .ReturnsAsync(new List<Booking> { booking });

        var command = new CancelBookingCommand(bookingId, "0999999999"); // Wrong phone number

        // Act
        Func<Task> act = async () => await _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<Exception>().WithMessage("Phone number does not match the booking owner.");
    }
}


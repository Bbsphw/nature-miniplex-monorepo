using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Moq;
using NatureMiniPlex.Core.Application.Features.Bookings.Commands.CreateBooking;
using NatureMiniPlex.Core.Application.Interfaces;
using NatureMiniPlex.Core.Application.Interfaces.Repositories;
using NatureMiniPlex.Core.Domain.Entities;
using Xunit;

namespace NatureMiniPlex.Application.UnitTests.Bookings;

public class CreateBookingCommandHandlerTests
{
    private readonly Mock<IShowtimeRepository> _mockShowtimeRepository;
    private readonly Mock<IBookingRepository> _mockBookingRepository;
    private readonly Mock<IRepository<Customer>> _mockCustomerRepository;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;

    public CreateBookingCommandHandlerTests()
    {
        _mockShowtimeRepository = new Mock<IShowtimeRepository>();
        _mockBookingRepository = new Mock<IBookingRepository>();
        _mockCustomerRepository = new Mock<IRepository<Customer>>();
        _mockUnitOfWork = new Mock<IUnitOfWork>();
    }

    [Fact]
    public async Task Handle_ShouldThrowException_WhenShowtimeIsLocked()
    {
        // Arrange
        var showtime = new Showtime { Id = 1 };
        showtime.LockShowtime(); // This sets IsLocked to true
        _mockShowtimeRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(showtime);

        var handler = new CreateBookingCommandHandler(
            _mockShowtimeRepository.Object,
            _mockBookingRepository.Object,
            _mockCustomerRepository.Object,
            _mockUnitOfWork.Object);

        var command = new CreateBookingCommand(1, "0812345678", new List<int> { 1 });

        // Act & Assert
        var ex = await Assert.ThrowsAsync<Exception>(() => handler.Handle(command, CancellationToken.None));
        Assert.Equal("Showtime is locked. Cannot book tickets.", ex.Message);
    }

    [Fact]
    public async Task Handle_ShouldCreateBookingAndCustomer_WhenValidGuest()
    {
        // Arrange
        var showtime = new Showtime { Id = 1, TicketPrice = 100 };
        _mockShowtimeRepository.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(showtime);
        _mockBookingRepository.Setup(x => x.GetBookedSeatsForShowtimeAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<BookingItem>());
            
        _mockCustomerRepository.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Customer>()); // No existing customer

        var handler = new CreateBookingCommandHandler(
            _mockShowtimeRepository.Object,
            _mockBookingRepository.Object,
            _mockCustomerRepository.Object,
            _mockUnitOfWork.Object);

        var command = new CreateBookingCommand(1, "0812345678", new List<int> { 1, 2 });

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotEqual(Guid.Empty, result);
        _mockCustomerRepository.Verify(x => x.AddAsync(It.IsAny<Customer>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockBookingRepository.Verify(x => x.AddAsync(It.IsAny<Booking>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}

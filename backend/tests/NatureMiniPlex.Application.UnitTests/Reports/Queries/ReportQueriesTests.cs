using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Moq;
using NatureMiniPlex.Application.UnitTests.Common;
using NatureMiniPlex.Core.Application.Features.Reports.Queries;
using NatureMiniPlex.Core.Domain.Entities;
using NatureMiniPlex.Core.Domain.Enums;
using Xunit;

namespace NatureMiniPlex.Application.UnitTests.Reports.Queries;

public class ReportQueriesTests : BaseTest
{
    private readonly GetDailyRevenueQueryHandler _handler;

    public ReportQueriesTests()
    {
        _handler = new GetDailyRevenueQueryHandler(MockBookingRepository.Object);
    }

    [Fact]
    public async Task GetDailyRevenueQueryHandler_ShouldCalculateRevenueCorrectly()
    {
        // Arrange
        var today = DateTime.UtcNow.Date;
        var bookings = new List<Booking>
        {
            new Booking 
            { 
                Id = Guid.NewGuid(), 
                BookingTime = today, 
                Status = BookingStatus.Completed,
                BookingItems = new List<BookingItem> 
                { 
                    new BookingItem { Price = 100, ItemStatus = ItemStatus.Active },
                    new BookingItem { Price = 150, ItemStatus = ItemStatus.Active },
                    new BookingItem { Price = 200, ItemStatus = ItemStatus.Canceled } // Should be ignored
                }
            },
            new Booking 
            { 
                Id = Guid.NewGuid(), 
                BookingTime = today.AddDays(-1), // Outside date range
                Status = BookingStatus.Completed,
                BookingItems = new List<BookingItem> { new BookingItem { Price = 300, ItemStatus = ItemStatus.Active } }
            },
            new Booking 
            { 
                Id = Guid.NewGuid(), 
                BookingTime = today, 
                Status = BookingStatus.Canceled, // Should be ignored
                BookingItems = new List<BookingItem> { new BookingItem { Price = 400, ItemStatus = ItemStatus.Active } }
            }
        };

        MockBookingRepository.Setup(x => x.GetBookingsForReportAsync(It.IsAny<DateTime>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
                             .ReturnsAsync((DateTime start, DateTime end, CancellationToken ct) => 
                                 bookings.Where(b => b.BookingTime.Date >= start.Date && b.BookingTime.Date <= end.Date).ToList());

        var query = new GetDailyRevenueQuery(today, today);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(1);
        result.First().Date.Should().Be(today);
        result.First().Revenue.Should().Be(250); // 100 + 150
    }
}

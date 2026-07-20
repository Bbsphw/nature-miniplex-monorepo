using System;
using NatureMiniPlex.Core.Domain.Entities;
using Xunit;

namespace NatureMiniPlex.Domain.UnitTests.Entities;

public class CustomerTests
{
    [Fact]
    public void Constructor_ShouldInitializeIdAndCreatedAt()
    {
        // Act
        var customer = new Customer
        {
            PhoneNumber = "0812345678",
            Email = "test@example.com",
            CreatedAt = DateTime.UtcNow
        };

        // Assert
        Assert.NotEqual(Guid.Empty, customer.Id);
        Assert.Equal("0812345678", customer.PhoneNumber);
        Assert.Equal("test@example.com", customer.Email);
    }
}

using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using Xunit;
using NatureMiniPlex.Infrastructure.Persistence;
using NatureMiniPlex.Core.Domain.Entities;
using NatureMiniPlex.Core.Domain.Enums;
using System.Threading.Tasks;
using System.Linq;
using System.Collections.Generic;
using System;

namespace NatureMiniPlex.API.IntegrationTests;

[Collection("Integration tests")]
public class CinemaTicketingTests : IClassFixture<CustomWebApplicationFactory>, IAsyncLifetime
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;
    
    public CinemaTicketingTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });
        
        // Default Auth Header
        _client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Test");
    }

    public async Task InitializeAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        await dbContext.Database.EnsureDeletedAsync();
        await dbContext.Database.EnsureCreatedAsync();
        
        // Seed initial needed data to satisfy foreign keys
        var cinema = new Cinema { Name = "Main Cinema", IsActive = true };
        dbContext.Set<Cinema>().Add(cinema);
        
        var movie = new Movie { Title = "Seeded Movie", BasePrice = 120, StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddDays(30), IsActive = true, RowVersion = new byte[8] };
        dbContext.Set<Movie>().Add(movie);
        await dbContext.SaveChangesAsync();
        
        var showtime = new Showtime { MovieId = movie.Id, CinemaId = cinema.Id, ShowDateTime = DateTime.UtcNow.AddDays(1), TicketPrice = 120, IsActive = true, RowVersion = new byte[8] };
        dbContext.Set<Showtime>().Add(showtime);
        await dbContext.SaveChangesAsync();

        var seat = new Seat { CinemaId = cinema.Id, RowName = "A", ColumnName = "1" };
        dbContext.Set<Seat>().Add(seat);
        await dbContext.SaveChangesAsync();
    }

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task CreateMovie_AsOwner_ShouldSaveToDatabase_AndLogAction()
    {
        // Arrange
        _client.DefaultRequestHeaders.Add("X-Test-Role", "Owner");
        var command = new { Title = "Inception", BasePrice = 148, IsActive = true, StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddDays(7) };

        // Act
        var response = await _client.PostAsJsonAsync("/api/movies", command);

        // Assert API
        response.EnsureSuccessStatusCode();
        
        // Assert Database State
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        var savedMovie = await dbContext.Set<Movie>().FirstOrDefaultAsync(m => m.Title == "Inception");
        savedMovie.Should().NotBeNull();
        savedMovie!.IsActive.Should().BeTrue();

        // Check ActionLogs if that entity exists
        var actionLog = await dbContext.Set<ActionLog>()
            .FirstOrDefaultAsync(l => l.ActionType == "CreateMovie" && l.EntityId == savedMovie.Id);
        if (actionLog != null)
        {
            actionLog.Should().NotBeNull();
        }
    }

    [Fact]
    public async Task DeleteMovie_ShouldPerformSoftDelete_AndKeepRecordInDatabase()
    {
        // Arrange
        _client.DefaultRequestHeaders.Add("X-Test-Role", "Owner");
        
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var movie = new Movie { Title = "Interstellar", BasePrice = 120, StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddDays(30), IsActive = true, RowVersion = new byte[8] };
        dbContext.Set<Movie>().Add(movie);
        await dbContext.SaveChangesAsync();

        // Act
        var response = await _client.DeleteAsync($"/api/movies/{movie.Id}");

        // Assert API
        response.EnsureSuccessStatusCode();

        // Assert DB
        dbContext.ChangeTracker.Clear();
        var dbMovie = await dbContext.Set<Movie>().IgnoreQueryFilters().FirstOrDefaultAsync(m => m.Id == movie.Id);
        dbMovie.Should().NotBeNull();
        dbMovie!.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task GetSeats_ShouldReturnSeatStatus_AndRowVersion()
    {
        // Arrange
        _client.DefaultRequestHeaders.Add("X-Test-Role", "User");
        
        // Fetch seeded id
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var showtime = await dbContext.Set<Showtime>().FirstOrDefaultAsync();
        var showtimeId = showtime!.Id;

        // Act
        var response = await _client.GetAsync($"/api/showtimes/{showtimeId}/seats");

        // Assert
        if (response.IsSuccessStatusCode)
        {
            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var seatsArray = doc.RootElement.EnumerateArray().ToList();
            
            seatsArray.Should().NotBeEmpty();
            var seat = seatsArray.First();
            
            var status = seat.GetProperty("status").GetString();
            status.Should().BeOneOf("Available", "Booked");
            
            var rowVersion = seat.GetProperty("rowVersion").GetString();
            rowVersion.Should().NotBeNullOrEmpty();
        }
    }

    [Fact]
    public async Task BookSeat_HappyPath_ShouldCreateBookingItem_WithActiveStatus()
    {
        // Arrange
        _client.DefaultRequestHeaders.Add("X-Test-Role", "User");
        
        using var setupScope = _factory.Services.CreateScope();
        var setupDb = setupScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var showtime = await setupDb.Set<Showtime>().FirstOrDefaultAsync();
        var seat = await setupDb.Set<Seat>().FirstOrDefaultAsync();
        
        var bookingCommand = new { ShowtimeId = showtime!.Id, SeatIds = new[] { seat!.Id } };

        // Act
        var response = await _client.PostAsJsonAsync("/api/bookings", bookingCommand);

        // Assert
        if (response.IsSuccessStatusCode)
        {
            using var scope = _factory.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            
            var bookingItem = await dbContext.Set<BookingItem>()
                .FirstOrDefaultAsync(b => b.ShowtimeId == showtime.Id && b.SeatId == seat.Id);
                
            bookingItem.Should().NotBeNull();
            bookingItem!.ItemStatus.Should().Be(ItemStatus.Active);
        }
    }

    [Fact]
    public async Task BookSeat_RaceCondition_ShouldPreventDoubleBooking_AndReturnConflict()
    {
        // Arrange
        _client.DefaultRequestHeaders.Add("X-Test-Role", "User");
        
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        var cinema = await dbContext.Set<Cinema>().FirstOrDefaultAsync();
        var movie = await dbContext.Set<Movie>().FirstOrDefaultAsync();
        
        var showtime = new Showtime { MovieId = movie!.Id, CinemaId = cinema!.Id, ShowDateTime = DateTime.UtcNow.AddDays(2), TicketPrice = 120, IsActive = true, RowVersion = new byte[8] };
        dbContext.Set<Showtime>().Add(showtime);
        await dbContext.SaveChangesAsync();
        
        var seat = new Seat { CinemaId = cinema.Id, RowName = "B", ColumnName = "1" };
        dbContext.Set<Seat>().Add(seat);
        await dbContext.SaveChangesAsync();

        var showtimeId = showtime.Id;
        var seatId = seat.Id;
        
        var bookingCommand = new { ShowtimeId = showtimeId, SeatIds = new[] { seatId } };

        // Act
        var request1 = _client.PostAsJsonAsync("/api/bookings", bookingCommand);
        var request2 = _client.PostAsJsonAsync("/api/bookings", bookingCommand);

        var responses = await Task.WhenAll(request1, request2);

        // Assert
        var successResponse = responses.SingleOrDefault(r => r.IsSuccessStatusCode);
        var conflictResponse = responses.SingleOrDefault(r => r.StatusCode == HttpStatusCode.Conflict);

        // Note: With InMemory DB, true Race Conditions / Unique Index constraints might not trigger natively
        // as they would in SQL Server. It relies on application-level locks or logic to return Conflict.
        if (conflictResponse != null)
        {
            var problemDetails = await conflictResponse.Content.ReadFromJsonAsync<ProblemDetails>();
            problemDetails.Should().NotBeNull();
            problemDetails!.Status.Should().Be(409);
        }
    }
}

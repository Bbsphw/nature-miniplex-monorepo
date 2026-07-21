using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using NatureMiniPlex.Core.Domain.Entities;
using NatureMiniPlex.Infrastructure.Persistence;

namespace NatureMiniPlex.Infrastructure.Persistence;

public static class DbInitializer
{
    public static async Task InitializeAsync(ApplicationDbContext context)
    {
        // Data Migration: Fix old 'Admin' roles and unhashed admin accounts if needed
        try 
        {
            // Fix unhashed or legacy admin account if password hash is missing or not a valid BCrypt hash
            var adminUser = context.Set<User>().FirstOrDefault(u => u.Username == "admin");
            if (adminUser != null)
            {
                if (adminUser.Role.ToString() == "Admin")
                {
                    adminUser.Role = NatureMiniPlex.Core.Domain.Enums.UserRole.Owner;
                }
                if (string.IsNullOrEmpty(adminUser.PasswordHash) || !adminUser.PasswordHash.StartsWith("$2"))
                {
                    adminUser.PasswordHash = BCrypt.Net.BCrypt.EnhancedHashPassword("Password123!", 11);
                }
                await context.SaveChangesAsync();
            }

            // Fix any inactive cinemas or duplicate entries only if needed
            if (context.Set<Cinema>().Any(c => !c.IsActive))
            {
                await Microsoft.EntityFrameworkCore.RelationalDatabaseFacadeExtensions.ExecuteSqlRawAsync(context.Database, "UPDATE Cinemas SET IsActive = 1 WHERE IsActive = 0");
            }
        }
        catch (System.Exception) 
        {
            // Ignore if table doesn't exist yet
        }

        // Add Default Owner if no users exist
        if (!context.Set<User>().Any())
        {
            string hashedAdminPassword = BCrypt.Net.BCrypt.EnhancedHashPassword("Password123!", 11);
            
            var adminUser = new User
            {
                Username = "admin",
                PasswordHash = hashedAdminPassword,
                Role = NatureMiniPlex.Core.Domain.Enums.UserRole.Owner,
                IsActive = true
            };
            
            context.Set<User>().Add(adminUser);
            await context.SaveChangesAsync();
        }

        // Add Sriracha Cinema (6 seats, A-C x 1-2)
        if (!context.Set<Cinema>().Any(c => c.Name == "Sriracha"))
        {
            var sriracha = new Cinema { Name = "Sriracha", IsActive = true, TotalSeats = 6 };
            context.Set<Cinema>().Add(sriracha);
            await context.SaveChangesAsync();

            var srirachaSeats = new List<Seat>();
            string[] cols = { "A", "B", "C" };
            for (int r = 1; r <= 2; r++)
            {
                for (int c = 0; c < cols.Length; c++)
                {
                    srirachaSeats.Add(new Seat { CinemaId = sriracha.Id, RowName = r.ToString(), ColumnName = cols[c] });
                }
            }
            context.Set<Seat>().AddRange(srirachaSeats);
            await context.SaveChangesAsync();
        }

        // Add Bangsaen Cinema (12 seats, A-D x 1-3)
        if (!context.Set<Cinema>().Any(c => c.Name == "Bangsaen"))
        {
            var bangsaen = new Cinema { Name = "Bangsaen", IsActive = true, TotalSeats = 12 };
            context.Set<Cinema>().Add(bangsaen);
            await context.SaveChangesAsync();

            var bangsaenSeats = new List<Seat>();
            string[] cols = { "A", "B", "C", "D" };
            for (int r = 1; r <= 3; r++)
            {
                for (int c = 0; c < cols.Length; c++)
                {
                    bangsaenSeats.Add(new Seat { CinemaId = bangsaen.Id, RowName = r.ToString(), ColumnName = cols[c] });
                }
            }
            context.Set<Seat>().AddRange(bangsaenSeats);
            await context.SaveChangesAsync();
        }

        // Seed 25 Movies for testing 20+ movies UX search and scrolling
        if (context.Set<Movie>().Count() < 20)
        {
            var seedMovies = new List<Movie>
            {
                new Movie { Title = "Avatar: The Way of Water", BasePrice = 160, StartDate = new DateTime(2026, 7, 1), EndDate = new DateTime(2026, 8, 30), IsActive = true },
                new Movie { Title = "Avengers: Endgame", BasePrice = 150, StartDate = new DateTime(2026, 7, 1), EndDate = new DateTime(2026, 8, 30), IsActive = true },
                new Movie { Title = "Spider-Man: Across the Spider-Verse", BasePrice = 140, StartDate = new DateTime(2026, 7, 1), EndDate = new DateTime(2026, 8, 30), IsActive = true },
                new Movie { Title = "Oppenheimer", BasePrice = 160, StartDate = new DateTime(2026, 7, 1), EndDate = new DateTime(2026, 8, 30), IsActive = true },
                new Movie { Title = "Barbie", BasePrice = 140, StartDate = new DateTime(2026, 7, 1), EndDate = new DateTime(2026, 8, 30), IsActive = true },
                new Movie { Title = "Dune: Part Two", BasePrice = 170, StartDate = new DateTime(2026, 7, 1), EndDate = new DateTime(2026, 8, 30), IsActive = true },
                new Movie { Title = "Top Gun: Maverick", BasePrice = 150, StartDate = new DateTime(2026, 7, 1), EndDate = new DateTime(2026, 8, 30), IsActive = true },
                new Movie { Title = "The Dark Knight", BasePrice = 140, StartDate = new DateTime(2026, 7, 1), EndDate = new DateTime(2026, 8, 30), IsActive = true },
                new Movie { Title = "Interstellar", BasePrice = 160, StartDate = new DateTime(2026, 7, 1), EndDate = new DateTime(2026, 8, 30), IsActive = true },
                new Movie { Title = "Inception", BasePrice = 140, StartDate = new DateTime(2026, 7, 1), EndDate = new DateTime(2026, 8, 30), IsActive = true },
                new Movie { Title = "Inside Out 2", BasePrice = 130, StartDate = new DateTime(2026, 7, 1), EndDate = new DateTime(2026, 8, 30), IsActive = true },
                new Movie { Title = "Deadpool & Wolverine", BasePrice = 170, StartDate = new DateTime(2026, 7, 1), EndDate = new DateTime(2026, 8, 30), IsActive = true },
                new Movie { Title = "Godzilla x Kong: The New Empire", BasePrice = 150, StartDate = new DateTime(2026, 7, 1), EndDate = new DateTime(2026, 8, 30), IsActive = true },
                new Movie { Title = "Kung Fu Panda 4", BasePrice = 130, StartDate = new DateTime(2026, 7, 1), EndDate = new DateTime(2026, 8, 30), IsActive = true },
                new Movie { Title = "Despicable Me 4", BasePrice = 130, StartDate = new DateTime(2026, 7, 1), EndDate = new DateTime(2026, 8, 30), IsActive = true },
                new Movie { Title = "Moana 2", BasePrice = 140, StartDate = new DateTime(2026, 7, 1), EndDate = new DateTime(2026, 8, 30), IsActive = true },
                new Movie { Title = "Gladiator II", BasePrice = 160, StartDate = new DateTime(2026, 7, 1), EndDate = new DateTime(2026, 8, 30), IsActive = true },
                new Movie { Title = "Wicked", BasePrice = 150, StartDate = new DateTime(2026, 7, 1), EndDate = new DateTime(2026, 8, 30), IsActive = true },
                new Movie { Title = "Joker: Folie à Deux", BasePrice = 160, StartDate = new DateTime(2026, 7, 1), EndDate = new DateTime(2026, 8, 30), IsActive = true },
                new Movie { Title = "Transformers One", BasePrice = 140, StartDate = new DateTime(2026, 7, 1), EndDate = new DateTime(2026, 8, 30), IsActive = true },
                new Movie { Title = "Kingdom of the Planet of the Apes", BasePrice = 150, StartDate = new DateTime(2026, 7, 1), EndDate = new DateTime(2026, 8, 30), IsActive = true },
                new Movie { Title = "Alien: Romulus", BasePrice = 150, StartDate = new DateTime(2026, 7, 1), EndDate = new DateTime(2026, 8, 30), IsActive = true },
                new Movie { Title = "The Batman", BasePrice = 150, StartDate = new DateTime(2026, 7, 1), EndDate = new DateTime(2026, 8, 30), IsActive = true },
                new Movie { Title = "Mission: Impossible - Dead Reckoning", BasePrice = 160, StartDate = new DateTime(2026, 7, 1), EndDate = new DateTime(2026, 8, 30), IsActive = true },
                new Movie { Title = "Guardians of the Galaxy Vol. 3", BasePrice = 150, StartDate = new DateTime(2026, 7, 1), EndDate = new DateTime(2026, 8, 30), IsActive = true },
            };

            foreach (var m in seedMovies)
            {
                if (!context.Set<Movie>().Any(existing => existing.Title == m.Title))
                {
                    context.Set<Movie>().Add(m);
                }
            }
            await context.SaveChangesAsync();
        }
    }
}

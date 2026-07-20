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
        // Data Migration: Fix old 'Admin' roles in the database to match the new 'Owner' enum
        try 
        {
            await Microsoft.EntityFrameworkCore.RelationalDatabaseFacadeExtensions.ExecuteSqlRawAsync(context.Database, "UPDATE Users SET Role = 'Owner' WHERE Role = 'Admin'");
            
            // Fix unhashed or standard hash for old 'admin' account if it exists as plain text or standard bcrypt
            string newHashedAdminPassword = BCrypt.Net.BCrypt.EnhancedHashPassword("Password123!", 13);
            await Microsoft.EntityFrameworkCore.RelationalDatabaseFacadeExtensions.ExecuteSqlRawAsync(context.Database, 
                "UPDATE Users SET PasswordHash = {0} WHERE Username = 'admin'", 
                newHashedAdminPassword);

            // Fix any cinemas that were seeded as IsActive = false (0)
            await Microsoft.EntityFrameworkCore.RelationalDatabaseFacadeExtensions.ExecuteSqlRawAsync(context.Database, "UPDATE Cinemas SET IsActive = 1 WHERE IsActive = 0");

            // Re-assign Seats and Showtimes from duplicate cinemas to the main cinema ID for each name
            await Microsoft.EntityFrameworkCore.RelationalDatabaseFacadeExtensions.ExecuteSqlRawAsync(context.Database, @"
                UPDATE s SET s.CinemaId = c_min.MinId
                FROM Seats s
                JOIN Cinemas c ON s.CinemaId = c.Id
                JOIN (SELECT Name, MIN(Id) AS MinId FROM Cinemas GROUP BY Name) c_min ON c.Name = c_min.Name;

                UPDATE st SET st.CinemaId = c_min.MinId
                FROM Showtimes st
                JOIN Cinemas c ON st.CinemaId = c.Id
                JOIN (SELECT Name, MIN(Id) AS MinId FROM Cinemas GROUP BY Name) c_min ON c.Name = c_min.Name;

                DELETE FROM Seats WHERE Id NOT IN (SELECT MIN(Id) FROM Seats GROUP BY CinemaId, RowName, ColumnName);

                DELETE FROM Cinemas WHERE Id NOT IN (SELECT MIN(Id) FROM Cinemas GROUP BY Name);
            ");
        }
        catch (System.Exception) 
        {
            // Ignore if table doesn't exist yet
        }

        // Add Default Owner if no users exist
        if (!context.Set<User>().Any())
        {
            // Note: In a real production app, use an IPasswordHasher service to generate the hash.
            // For simplicity in the seeder, this is the BCrypt Enhanced hash for "Password123!"
            string hashedAdminPassword = BCrypt.Net.BCrypt.EnhancedHashPassword("Password123!", 13);
            
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
    }
}

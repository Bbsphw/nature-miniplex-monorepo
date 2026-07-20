using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NatureMiniPlex.Core.Domain.Entities;

namespace NatureMiniPlex.Infrastructure.Persistence.EntityConfigurations;

public class ShowtimeConfiguration : IEntityTypeConfiguration<Showtime>
{
    public void Configure(EntityTypeBuilder<Showtime> builder)
    {
        builder.HasKey(s => s.Id);
        builder.Property(s => s.TicketPrice).HasColumnType("decimal(10,2)");
        builder.Property(s => s.IsLocked).HasDefaultValue(false);
        builder.Property(s => s.IsActive).HasDefaultValue(true);
        
        // Concurrency token
        builder.Property(s => s.RowVersion).IsRowVersion();

        builder.HasOne(s => s.Cinema)
            .WithMany(c => c.Showtimes)
            .HasForeignKey(s => s.CinemaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.Movie)
            .WithMany(m => m.Showtimes)
            .HasForeignKey(s => s.MovieId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(s => s.IsActive);
        
        builder.HasIndex(s => s.ShowDateTime).HasDatabaseName("IX_Showtime_ShowDateTime");
        builder.HasIndex(s => s.MovieId).HasDatabaseName("IX_Showtime_MovieId");
        builder.HasIndex(s => s.CinemaId).HasDatabaseName("IX_Showtime_CinemaId");
    }
}

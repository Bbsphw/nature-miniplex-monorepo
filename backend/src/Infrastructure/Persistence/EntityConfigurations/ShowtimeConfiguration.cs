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
    }
}

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NatureMiniPlex.Core.Domain.Entities;

namespace NatureMiniPlex.Infrastructure.Persistence.EntityConfigurations;

public class BookingItemConfiguration : IEntityTypeConfiguration<BookingItem>
{
    public void Configure(EntityTypeBuilder<BookingItem> builder)
    {
        builder.HasKey(b => b.Id);
        
        // Removed NEWSEQUENTIALID()
        
        builder.Property(b => b.RowVersion).IsRowVersion();
        builder.Property(b => b.Price).HasColumnType("decimal(10,2)");
        
        builder.Property(b => b.ItemStatus)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsUnicode(false);

        builder.HasOne(b => b.Booking)
            .WithMany(book => book.BookingItems)
            .HasForeignKey(b => b.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(b => b.Showtime)
            .WithMany(s => s.BookingItems)
            .HasForeignKey(b => b.ShowtimeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(b => b.Seat)
            .WithMany()
            .HasForeignKey(b => b.SeatId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(b => new { b.ShowtimeId, b.SeatId })
            .IsUnique()
            .HasFilter("[ItemStatus] = 'Active'")
            .HasDatabaseName("IX_BookingItem_Showtime_Seat_Active");
            
        builder.HasQueryFilter(b => b.Showtime.IsActive);
    }
}

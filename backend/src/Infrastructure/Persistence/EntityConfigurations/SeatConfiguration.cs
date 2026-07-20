using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NatureMiniPlex.Core.Domain.Entities;

namespace NatureMiniPlex.Infrastructure.Persistence.EntityConfigurations;

public class SeatConfiguration : IEntityTypeConfiguration<Seat>
{
    public void Configure(EntityTypeBuilder<Seat> builder)
    {
        builder.HasKey(s => s.Id);
        builder.Property(s => s.RowName).IsRequired().HasMaxLength(5).IsUnicode(false);
        builder.Property(s => s.ColumnName).IsRequired().HasMaxLength(5).IsUnicode(false);

        builder.HasOne(s => s.Cinema)
            .WithMany(c => c.Seats)
            .HasForeignKey(s => s.CinemaId)
            .OnDelete(DeleteBehavior.Cascade);
            
        builder.HasQueryFilter(s => s.Cinema.IsActive);
    }
}

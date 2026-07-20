using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NatureMiniPlex.Core.Domain.Entities;

namespace NatureMiniPlex.Infrastructure.Persistence.EntityConfigurations;

public class MovieConfiguration : IEntityTypeConfiguration<Movie>
{
    public void Configure(EntityTypeBuilder<Movie> builder)
    {
        builder.HasKey(m => m.Id);
        builder.Property(m => m.Title).IsRequired().HasMaxLength(200).IsUnicode(false);
        builder.Property(m => m.StartDate).HasColumnType("date");
        builder.Property(m => m.EndDate).HasColumnType("date");
        builder.Property(m => m.BasePrice).HasColumnType("decimal(10,2)");
        builder.Property(m => m.IsActive).HasDefaultValue(true);
        
        // Concurrency token
        builder.Property(m => m.RowVersion).IsRowVersion();

        builder.HasIndex(m => m.Title).IsUnique();
        builder.HasQueryFilter(m => m.IsActive);
        
        builder.ToTable(t => t.HasCheckConstraint("CK_Movie_Dates", "[StartDate] <= [EndDate]"));
    }
}

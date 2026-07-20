using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NatureMiniPlex.Core.Domain.Entities;

namespace NatureMiniPlex.Infrastructure.Persistence.EntityConfigurations;

public class CinemaConfiguration : IEntityTypeConfiguration<Cinema>
{
    public void Configure(EntityTypeBuilder<Cinema> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Name).IsRequired().HasMaxLength(100).IsUnicode(false);
        builder.Property(c => c.IsActive).HasDefaultValue(true);

        builder.HasQueryFilter(c => c.IsActive);
    }
}

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NatureMiniPlex.Core.Domain.Entities;

namespace NatureMiniPlex.Infrastructure.Persistence.EntityConfigurations;

public class PermissionConfiguration : IEntityTypeConfiguration<Permission>
{
    public void Configure(EntityTypeBuilder<Permission> builder)
    {
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Code).IsRequired().HasMaxLength(100).IsUnicode(false);
        builder.Property(p => p.Resource).IsRequired().HasMaxLength(50).IsUnicode(false);
        builder.Property(p => p.Action).IsRequired().HasMaxLength(50).IsUnicode(false);
        builder.Property(p => p.Description).HasMaxLength(255);

        builder.HasIndex(p => p.Code).IsUnique();
    }
}

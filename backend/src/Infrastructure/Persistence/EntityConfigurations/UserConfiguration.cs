using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NatureMiniPlex.Core.Domain.Entities;

namespace NatureMiniPlex.Infrastructure.Persistence.EntityConfigurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(u => u.Id);
        builder.Property(u => u.Username).IsRequired().HasMaxLength(50).IsUnicode(false);
        builder.Property(u => u.PasswordHash).IsRequired().HasMaxLength(255).IsUnicode(false);
        
        builder.Property(u => u.Role)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsUnicode(false);
            
        builder.Property(u => u.IsActive).HasDefaultValue(true);

        builder.HasIndex(u => u.Username).IsUnique();
        builder.HasQueryFilter(u => u.IsActive);
    }
}

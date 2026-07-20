using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NatureMiniPlex.Core.Domain.Entities;

namespace NatureMiniPlex.Infrastructure.Persistence.EntityConfigurations;

public class ActionLogConfiguration : IEntityTypeConfiguration<ActionLog>
{
    public void Configure(EntityTypeBuilder<ActionLog> builder)
    {
        builder.HasKey(a => a.Id);
        builder.Property(a => a.ActionType).IsRequired().HasMaxLength(50).IsUnicode(false);
        builder.Property(a => a.EntityName).IsRequired().HasMaxLength(50).IsUnicode(false);
        builder.Property(a => a.Timestamp).HasDefaultValueSql("GETDATE()");

        builder.HasOne(a => a.User)
            .WithMany(u => u.ActionLogs)
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Restrict);
            
        builder.HasQueryFilter(a => a.User.IsActive);
    }
}

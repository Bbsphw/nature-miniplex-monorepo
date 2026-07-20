using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NatureMiniPlex.Core.Domain.Entities;

namespace NatureMiniPlex.Infrastructure.Persistence.EntityConfigurations;

public class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        builder.HasKey(c => c.Id);
        
        // Removed NEWSEQUENTIALID()
        
        builder.Property(c => c.PhoneNumber).IsRequired().HasMaxLength(15).IsUnicode(false);
        builder.Property(c => c.CreatedAt).HasDefaultValueSql("GETDATE()");

        builder.HasIndex(c => c.PhoneNumber).HasDatabaseName("IX_Customer_PhoneNumber").IsUnique();
    }
}

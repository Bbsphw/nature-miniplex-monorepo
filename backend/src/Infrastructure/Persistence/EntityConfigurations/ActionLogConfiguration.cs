using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NatureMiniPlex.Core.Domain.Entities;

namespace NatureMiniPlex.Infrastructure.Persistence.EntityConfigurations;

/// <summary>
/// EF Core Entity Configuration สำหรับตาราง ActionLogs
/// จัดทำ Index และ Constraints เพิ่มประสิทธิภาพการค้นหา Audit Logs ของ Admin
/// </summary>
public class ActionLogConfiguration : IEntityTypeConfiguration<ActionLog>
{
    public void Configure(EntityTypeBuilder<ActionLog> builder)
    {
        builder.ToTable("ActionLogs");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.LogLevel)
            .IsRequired()
            .HasMaxLength(20)
            .IsUnicode(false)
            .HasDefaultValue("INFO");

        builder.Property(a => a.ActionName)
            .IsRequired()
            .HasMaxLength(100)
            .IsUnicode(false);

        builder.Property(a => a.HttpMethod)
            .IsRequired()
            .HasMaxLength(10)
            .IsUnicode(false);

        builder.Property(a => a.ActorEmail)
            .HasMaxLength(256);

        builder.Property(a => a.ActorRole)
            .HasMaxLength(50)
            .IsUnicode(false);

        builder.Property(a => a.IpAddress)
            .HasMaxLength(45) // รองรับทั้ง IPv4 และ IPv6
            .IsUnicode(false);

        builder.Property(a => a.TargetId)
            .HasMaxLength(100)
            .IsUnicode(false);

        builder.Property(a => a.TargetType)
            .HasMaxLength(100)
            .IsUnicode(false);

        builder.Property(a => a.UserAgent)
            .HasMaxLength(500);

        builder.Property(a => a.SessionId)
            .HasMaxLength(100)
            .IsUnicode(false);

        builder.Property(a => a.Location)
            .HasMaxLength(256);

        builder.Property(a => a.DetailJson)
            .HasColumnType("nvarchar(max)"); // จัดเก็บ Standardized JSON Payload { "before": ..., "after": ... }

        builder.Property(a => a.Timestamp)
            .HasDefaultValueSql("GETUTCDATE()");

        // Foreign Key Isolation (Nullable for Anonymous Actions)
        builder.HasOne(a => a.User)
            .WithMany(u => u.ActionLogs)
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        // Performance Indexes สำหรับ Audit Log Searching
        builder.HasIndex(a => a.Timestamp).HasDatabaseName("IX_ActionLogs_Timestamp");
        builder.HasIndex(a => a.UserId).HasDatabaseName("IX_ActionLogs_UserId");
        builder.HasIndex(a => a.ActionName).HasDatabaseName("IX_ActionLogs_ActionName");
        builder.HasIndex(a => a.LogLevel).HasDatabaseName("IX_ActionLogs_LogLevel");
    }
}

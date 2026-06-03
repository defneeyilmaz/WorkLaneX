using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WorkLaneX.Domain.Entities;

namespace WorkLaneX.Infrastructure.Persistence.Configurations;

public class ActivityLogConfiguration : IEntityTypeConfiguration<ActivityLog>
{
    public void Configure(EntityTypeBuilder<ActivityLog> builder)
    {
        builder.ToTable("activity_logs");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.Action)
            .HasConversion<string>()
            .HasMaxLength(32);

        builder.Property(a => a.Detail)
            .HasMaxLength(500);

        builder.HasIndex(a => new { a.TaskId, a.CreatedAt });
        builder.HasIndex(a => new { a.ProjectId, a.CreatedAt });

        builder.HasOne(a => a.Task)
            .WithMany()
            .HasForeignKey(a => a.TaskId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WorkLaneX.Domain.Entities;

namespace WorkLaneX.Infrastructure.Persistence.Configurations;

public class TaskItemConfiguration : IEntityTypeConfiguration<TaskItem>
{
    public void Configure(EntityTypeBuilder<TaskItem> builder)
    {
        builder.ToTable("tasks");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(t => t.Description)
            .HasMaxLength(2000);

        builder.Property(t => t.Status)
            .HasConversion<string>()
            .HasMaxLength(32);

        builder.Property(t => t.Priority)
            .HasConversion<string>()
            .HasMaxLength(32);

        builder.Property(t => t.ApprovalStatus)
            .HasConversion<string>()
            .HasMaxLength(32);

        builder.Property(t => t.CompletionNote)
            .HasMaxLength(2000);

        builder.Property(t => t.RejectionNote)
            .HasMaxLength(2000);

        builder.Property(t => t.SortOrder)
            .HasDefaultValue(0);

        builder.HasIndex(t => new { t.ProjectId, t.Status, t.SortOrder });
        builder.HasIndex(t => t.AssigneeId);
    }
}

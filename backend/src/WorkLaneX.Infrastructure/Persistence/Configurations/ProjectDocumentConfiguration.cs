using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WorkLaneX.Domain.Entities;
using WorkLaneX.Domain.Enums;

namespace WorkLaneX.Infrastructure.Persistence.Configurations;

public class ProjectDocumentConfiguration : IEntityTypeConfiguration<ProjectDocument>
{
    public void Configure(EntityTypeBuilder<ProjectDocument> builder)
    {
        builder.ToTable("project_documents");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(d => d.Content)
            .IsRequired()
            .HasColumnType("text");

        builder.Property(d => d.Type)
            .HasConversion<string>()
            .HasMaxLength(32)
            .HasDefaultValue(DocumentType.Spec);

        builder.HasIndex(d => new { d.ProjectId, d.Type, d.UpdatedAt, d.CreatedAt });

        builder.HasOne(d => d.Project)
            .WithMany(p => p.Documents)
            .HasForeignKey(d => d.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

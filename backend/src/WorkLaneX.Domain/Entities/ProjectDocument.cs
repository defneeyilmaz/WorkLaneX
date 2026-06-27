using WorkLaneX.Domain.Common;
using WorkLaneX.Domain.Enums;

namespace WorkLaneX.Domain.Entities;

public class ProjectDocument : BaseEntity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;

    public Guid AuthorId { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DocumentType Type { get; set; } = DocumentType.Spec;
    public DateTime? MeetingHeldAt { get; set; }
}

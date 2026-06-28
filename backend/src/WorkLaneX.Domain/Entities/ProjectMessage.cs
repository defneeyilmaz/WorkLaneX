using WorkLaneX.Domain.Common;

namespace WorkLaneX.Domain.Entities;

public class ProjectMessage : BaseEntity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;

    public Guid AuthorId { get; set; }
    public string Body { get; set; } = string.Empty;
}

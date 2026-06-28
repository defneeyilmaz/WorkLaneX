using WorkLaneX.Domain.Common;

namespace WorkLaneX.Domain.Entities;

public class Project : BaseEntity
{
    public Guid WorkspaceId { get; set; }
    public Workspace Workspace { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    public ICollection<TaskItem> Tasks { get; set; } = [];
    public ICollection<ProjectDocument> Documents { get; set; } = [];
    public ICollection<ProjectMessage> Messages { get; set; } = [];
}

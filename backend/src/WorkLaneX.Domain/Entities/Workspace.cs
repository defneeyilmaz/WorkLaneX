using WorkLaneX.Domain.Common;

namespace WorkLaneX.Domain.Entities;

public class Workspace : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid OwnerId { get; set; }

    public ICollection<WorkspaceMember> Members { get; set; } = [];
    public ICollection<Project> Projects { get; set; } = [];
}

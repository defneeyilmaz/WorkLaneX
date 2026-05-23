using WorkLaneX.Domain.Common;
using WorkLaneX.Domain.Enums;

namespace WorkLaneX.Domain.Entities;

public class WorkspaceMember : BaseEntity
{
    public Guid WorkspaceId { get; set; }
    public Workspace Workspace { get; set; } = null!;

    public Guid UserId { get; set; }
    public WorkspaceRole Role { get; set; }
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}

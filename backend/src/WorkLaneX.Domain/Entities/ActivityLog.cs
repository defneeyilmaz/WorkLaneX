using WorkLaneX.Domain.Common;
using WorkLaneX.Domain.Enums;

namespace WorkLaneX.Domain.Entities;

public class ActivityLog : BaseEntity
{
    public Guid TaskId { get; set; }
    public TaskItem Task { get; set; } = null!;

    public Guid ProjectId { get; set; }
    public Guid WorkspaceId { get; set; }

    public Guid ActorId { get; set; }
    public ActivityActionType Action { get; set; }
    public string? Detail { get; set; }
}

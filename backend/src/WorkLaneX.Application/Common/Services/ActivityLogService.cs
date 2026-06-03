using WorkLaneX.Application.Common.Interfaces;
using WorkLaneX.Domain.Entities;
using WorkLaneX.Domain.Enums;

namespace WorkLaneX.Application.Common.Services;

public class ActivityLogService : IActivityLogService
{
    private readonly IApplicationDbContext _context;

    public ActivityLogService(IApplicationDbContext context)
    {
        _context = context;
    }

    public void Record(
        Guid taskId,
        Guid projectId,
        Guid workspaceId,
        Guid actorId,
        ActivityActionType action,
        string? detail = null)
    {
        _context.ActivityLogs.Add(new ActivityLog
        {
            TaskId = taskId,
            ProjectId = projectId,
            WorkspaceId = workspaceId,
            ActorId = actorId,
            Action = action,
            Detail = detail,
        });
    }
}

using WorkLaneX.Domain.Enums;

namespace WorkLaneX.Application.Common.Interfaces;

public interface IActivityLogService
{
    void Record(
        Guid taskId,
        Guid projectId,
        Guid workspaceId,
        Guid actorId,
        ActivityActionType action,
        string? detail = null);
}

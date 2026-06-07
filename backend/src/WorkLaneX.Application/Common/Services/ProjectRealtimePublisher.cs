using WorkLaneX.Application.Common.Interfaces;
using WorkLaneX.Application.Common.Models;

namespace WorkLaneX.Application.Common.Services;

public static class ProjectRealtimePublisher
{
    public static Task SendTaskEventAsync(
        IProjectRealtimeNotifier notifier,
        Guid actorId,
        TaskSummary summary,
        string eventName,
        CancellationToken cancellationToken = default) =>
        notifier.SendToProjectAsync(
            summary.ProjectId,
            eventName,
            summary,
            actorId,
            cancellationToken);
}

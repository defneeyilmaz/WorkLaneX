namespace WorkLaneX.Application.Common.Interfaces;

public interface IProjectRealtimeNotifier
{
    Task SendToProjectAsync(
        Guid projectId,
        string eventName,
        object payload,
        Guid actorId,
        CancellationToken cancellationToken = default);
}

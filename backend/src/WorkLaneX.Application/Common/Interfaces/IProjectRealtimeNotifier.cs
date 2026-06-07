namespace WorkLaneX.Application.Common.Interfaces;

public interface IProjectRealtimeNotifier
{
    Task SendToProjectAsync(
        Guid projectId,
        string eventName,
        object payload,
        CancellationToken cancellationToken = default);
}

using Microsoft.AspNetCore.SignalR;
using WorkLaneX.Api.Hubs;
using WorkLaneX.Application.Common.Interfaces;
using WorkLaneX.Application.Common.Models.Realtime;

namespace WorkLaneX.Api.Services;

public class ProjectRealtimeNotifier : IProjectRealtimeNotifier
{
    private readonly IHubContext<ProjectHub> _hubContext;

    public ProjectRealtimeNotifier(IHubContext<ProjectHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public Task SendToProjectAsync(
        Guid projectId,
        string eventName,
        object payload,
        CancellationToken cancellationToken = default)
    {
        var envelope = new RealtimeEnvelope(eventName, payload);

        return _hubContext.Clients
            .Group(ProjectHub.GroupName(projectId))
            .SendAsync(ProjectHub.ClientMethod, envelope, cancellationToken);
    }
}

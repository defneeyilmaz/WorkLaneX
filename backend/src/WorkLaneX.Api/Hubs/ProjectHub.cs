using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using WorkLaneX.Application.Common.Interfaces;

namespace WorkLaneX.Api.Hubs;

[Authorize]
public class ProjectHub : Hub
{
    public const string HubPath = "/hubs/project";
    public const string ClientMethod = "ProjectEvent";

    private readonly IApplicationDbContext _context;
    private readonly IWorkspaceAuthorizationService _authorization;

    public ProjectHub(
        IApplicationDbContext context,
        IWorkspaceAuthorizationService authorization)
    {
        _context = context;
        _authorization = authorization;
    }

    public async Task JoinProject(Guid projectId)
    {
        if (!await CanAccessProjectAsync(projectId))
        {
            throw new HubException("Project not found or you do not have access.");
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(projectId));
    }

    public async Task LeaveProject(Guid projectId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupName(projectId));
    }

    public static string GroupName(Guid projectId) => $"project:{projectId}";

    private async Task<bool> CanAccessProjectAsync(Guid projectId)
    {
        var userId = GetUserId();
        if (userId is null)
        {
            return false;
        }

        var project = await _context.Projects
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == projectId);

        if (project is null)
        {
            return false;
        }

        var membership = await _authorization.GetMembershipAsync(project.WorkspaceId, userId.Value);
        return membership is not null;
    }

    private Guid? GetUserId()
    {
        var sub = Context.User?.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);

        return Guid.TryParse(sub, out var userId) ? userId : null;
    }
}

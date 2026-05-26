using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkLaneX.Application.Common.Interfaces;
using WorkLaneX.Application.Common.Models;

namespace WorkLaneX.Application.Features.Workspaces.Queries.ListMyWorkspaces;

public class ListMyWorkspacesQueryHandler
    : IRequestHandler<ListMyWorkspacesQuery, IReadOnlyList<WorkspaceSummary>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public ListMyWorkspacesQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<WorkspaceSummary>> Handle(
        ListMyWorkspacesQuery request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        if (userId is null)
        {
            return [];
        }

        return await _context.WorkspaceMembers
            .AsNoTracking()
            .Where(m => m.UserId == userId.Value)
            .OrderByDescending(m => m.JoinedAt)
            .Select(m => new WorkspaceSummary(
                m.Workspace.Id,
                m.Workspace.Name,
                m.Workspace.Description,
                m.Role,
                m.Workspace.CreatedAt))
            .ToListAsync(cancellationToken);
    }
}

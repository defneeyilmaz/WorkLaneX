using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkLaneX.Application.Common.Interfaces;
using WorkLaneX.Application.Common.Models;

namespace WorkLaneX.Application.Features.Projects.Queries.ListProjectsByWorkspace;

public class ListProjectsByWorkspaceQueryHandler
    : IRequestHandler<ListProjectsByWorkspaceQuery, OperationResult<IReadOnlyList<ProjectSummary>>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public ListProjectsByWorkspaceQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<OperationResult<IReadOnlyList<ProjectSummary>>> Handle(
        ListProjectsByWorkspaceQuery request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        if (userId is null)
        {
            return OperationResult<IReadOnlyList<ProjectSummary>>.Failure(
                "You must be signed in.");
        }

        var hasAccess = await _context.WorkspaceMembers.AnyAsync(
            m => m.WorkspaceId == request.WorkspaceId && m.UserId == userId.Value,
            cancellationToken);

        if (!hasAccess)
        {
            return OperationResult<IReadOnlyList<ProjectSummary>>.Failure(
                "Workspace not found or you do not have access.");
        }

        var projects = await _context.Projects
            .AsNoTracking()
            .Where(p => p.WorkspaceId == request.WorkspaceId)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new ProjectSummary(
                p.Id,
                p.WorkspaceId,
                p.Name,
                p.Description,
                p.CreatedAt))
            .ToListAsync(cancellationToken);

        return OperationResult<IReadOnlyList<ProjectSummary>>.Success(projects);
    }
}

using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkLaneX.Application.Common.Interfaces;
using WorkLaneX.Application.Common.Models;

namespace WorkLaneX.Application.Features.Workspaces.Queries.ListWorkspaceMembers;

public class ListWorkspaceMembersQueryHandler
    : IRequestHandler<ListWorkspaceMembersQuery, OperationResult<IReadOnlyList<WorkspaceMemberSummary>>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IWorkspaceAuthorizationService _authorization;
    private readonly IUserDirectory _userDirectory;

    public ListWorkspaceMembersQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser,
        IWorkspaceAuthorizationService authorization,
        IUserDirectory userDirectory)
    {
        _context = context;
        _currentUser = currentUser;
        _authorization = authorization;
        _userDirectory = userDirectory;
    }

    public async Task<OperationResult<IReadOnlyList<WorkspaceMemberSummary>>> Handle(
        ListWorkspaceMembersQuery request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        if (userId is null)
        {
            return OperationResult<IReadOnlyList<WorkspaceMemberSummary>>.Failure(
                "You must be signed in.");
        }

        var membership = await _authorization.GetMembershipAsync(
            request.WorkspaceId,
            userId.Value,
            cancellationToken);

        if (membership is null || !_authorization.CanInviteMembers(membership.Role))
        {
            return OperationResult<IReadOnlyList<WorkspaceMemberSummary>>.Failure(
                "You do not have permission to view members.");
        }

        var members = await _context.WorkspaceMembers
            .AsNoTracking()
            .Where(m => m.WorkspaceId == request.WorkspaceId)
            .ToListAsync(cancellationToken);

        var users = await _userDirectory.GetUsersAsync(
            members.Select(m => m.UserId),
            cancellationToken);

        var summaries = members
            .Select(m =>
            {
                users.TryGetValue(m.UserId, out var user);
                return new WorkspaceMemberSummary(
                    m.UserId,
                    user?.Email ?? string.Empty,
                    user?.FullName ?? string.Empty,
                    m.Role,
                    m.JoinedAt);
            })
            .OrderBy(m => m.Role)
            .ThenBy(m => m.FullName)
            .ToList();

        return OperationResult<IReadOnlyList<WorkspaceMemberSummary>>.Success(summaries);
    }
}

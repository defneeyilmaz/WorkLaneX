using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkLaneX.Application.Common.Interfaces;
using WorkLaneX.Application.Common.Mapping;
using WorkLaneX.Application.Common.Models;

namespace WorkLaneX.Application.Features.Tasks.Queries.ListTaskActivity;

public class ListTaskActivityQueryHandler
    : IRequestHandler<ListTaskActivityQuery, OperationResult<IReadOnlyList<ActivityLogSummary>>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IWorkspaceAuthorizationService _authorization;
    private readonly IUserDirectory _userDirectory;

    public ListTaskActivityQueryHandler(
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

    public async Task<OperationResult<IReadOnlyList<ActivityLogSummary>>> Handle(
        ListTaskActivityQuery request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        if (userId is null)
        {
            return OperationResult<IReadOnlyList<ActivityLogSummary>>.Failure(
                "You must be signed in.");
        }

        var task = await _context.TaskItems
            .AsNoTracking()
            .Include(t => t.Project)
            .FirstOrDefaultAsync(t => t.Id == request.TaskId, cancellationToken);

        if (task is null)
        {
            return OperationResult<IReadOnlyList<ActivityLogSummary>>.Failure(
                "Task not found or you do not have access.");
        }

        var membership = await _authorization.GetMembershipAsync(
            task.Project.WorkspaceId,
            userId.Value,
            cancellationToken);

        if (membership is null)
        {
            return OperationResult<IReadOnlyList<ActivityLogSummary>>.Failure(
                "Task not found or you do not have access.");
        }

        var logs = await _context.ActivityLogs
            .AsNoTracking()
            .Where(a => a.TaskId == request.TaskId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(cancellationToken);

        var actorIds = logs.Select(l => l.ActorId).Distinct();
        var actorNames = await _userDirectory.GetFullNamesAsync(actorIds, cancellationToken);

        var summaries = logs
            .Select(l => new ActivityLogSummary(
                l.Id,
                l.TaskId,
                l.Action,
                l.Detail,
                l.ActorId,
                actorNames.GetValueOrDefault(l.ActorId, "Unknown"),
                ActivityLogFormatter.Format(l.Action, l.Detail),
                l.CreatedAt))
            .ToList();

        return OperationResult<IReadOnlyList<ActivityLogSummary>>.Success(summaries);
    }
}

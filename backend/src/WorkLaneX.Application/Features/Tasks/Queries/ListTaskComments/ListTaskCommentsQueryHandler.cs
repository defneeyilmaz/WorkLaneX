using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkLaneX.Application.Common.Interfaces;
using WorkLaneX.Application.Common.Models;

namespace WorkLaneX.Application.Features.Tasks.Queries.ListTaskComments;

public class ListTaskCommentsQueryHandler
    : IRequestHandler<ListTaskCommentsQuery, OperationResult<IReadOnlyList<TaskCommentSummary>>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IWorkspaceAuthorizationService _authorization;
    private readonly IUserDirectory _userDirectory;

    public ListTaskCommentsQueryHandler(
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

    public async Task<OperationResult<IReadOnlyList<TaskCommentSummary>>> Handle(
        ListTaskCommentsQuery request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        if (userId is null)
        {
            return OperationResult<IReadOnlyList<TaskCommentSummary>>.Failure(
                "You must be signed in.");
        }

        var task = await _context.TaskItems
            .AsNoTracking()
            .Include(t => t.Project)
            .FirstOrDefaultAsync(t => t.Id == request.TaskId, cancellationToken);

        if (task is null)
        {
            return OperationResult<IReadOnlyList<TaskCommentSummary>>.Failure(
                "Task not found or you do not have access.");
        }

        var membership = await _authorization.GetMembershipAsync(
            task.Project.WorkspaceId,
            userId.Value,
            cancellationToken);

        if (membership is null)
        {
            return OperationResult<IReadOnlyList<TaskCommentSummary>>.Failure(
                "Task not found or you do not have access.");
        }

        var comments = await _context.TaskComments
            .AsNoTracking()
            .Where(c => c.TaskId == request.TaskId)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync(cancellationToken);

        var authorIds = comments.Select(c => c.AuthorId).Distinct();
        var authorNames = await _userDirectory.GetFullNamesAsync(authorIds, cancellationToken);

        var summaries = comments
            .Select(c => new TaskCommentSummary(
                c.Id,
                c.TaskId,
                c.Body,
                c.AuthorId,
                authorNames.GetValueOrDefault(c.AuthorId, "Unknown"),
                c.CreatedAt))
            .ToList();

        return OperationResult<IReadOnlyList<TaskCommentSummary>>.Success(summaries);
    }
}

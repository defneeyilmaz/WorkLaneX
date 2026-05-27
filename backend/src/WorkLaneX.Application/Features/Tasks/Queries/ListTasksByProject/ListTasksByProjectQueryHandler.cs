using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkLaneX.Application.Common.Interfaces;
using WorkLaneX.Application.Common.Models;

namespace WorkLaneX.Application.Features.Tasks.Queries.ListTasksByProject;

public class ListTasksByProjectQueryHandler
    : IRequestHandler<ListTasksByProjectQuery, OperationResult<IReadOnlyList<TaskSummary>>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public ListTasksByProjectQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<OperationResult<IReadOnlyList<TaskSummary>>> Handle(
        ListTasksByProjectQuery request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        if (userId is null)
        {
            return OperationResult<IReadOnlyList<TaskSummary>>.Failure("You must be signed in.");
        }

        var hasAccess = await _context.Projects
            .AnyAsync(
                p => p.Id == request.ProjectId &&
                     p.Workspace.Members.Any(m => m.UserId == userId.Value),
                cancellationToken);

        if (!hasAccess)
        {
            return OperationResult<IReadOnlyList<TaskSummary>>.Failure(
                "Project not found or you do not have access.");
        }

        var tasks = await _context.TaskItems
            .AsNoTracking()
            .Where(t => t.ProjectId == request.ProjectId)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new TaskSummary(
                t.Id,
                t.ProjectId,
                t.Title,
                t.Description,
                t.Status,
                t.Priority,
                t.CreatedAt))
            .ToListAsync(cancellationToken);

        return OperationResult<IReadOnlyList<TaskSummary>>.Success(tasks);
    }
}

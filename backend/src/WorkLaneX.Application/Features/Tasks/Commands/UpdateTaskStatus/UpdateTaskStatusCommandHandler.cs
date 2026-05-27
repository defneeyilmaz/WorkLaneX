using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkLaneX.Application.Common.Interfaces;
using WorkLaneX.Application.Common.Models;

namespace WorkLaneX.Application.Features.Tasks.Commands.UpdateTaskStatus;

public class UpdateTaskStatusCommandHandler
    : IRequestHandler<UpdateTaskStatusCommand, OperationResult<TaskSummary>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public UpdateTaskStatusCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<OperationResult<TaskSummary>> Handle(
        UpdateTaskStatusCommand request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        if (userId is null)
        {
            return OperationResult<TaskSummary>.Failure("You must be signed in.");
        }

        var task = await _context.TaskItems
            .FirstOrDefaultAsync(t => t.Id == request.TaskId, cancellationToken);

        if (task is null)
        {
            return OperationResult<TaskSummary>.Failure("Task not found.");
        }

        var hasAccess = await _context.Projects
            .AnyAsync(
                p => p.Id == task.ProjectId &&
                     p.Workspace.Members.Any(m => m.UserId == userId.Value),
                cancellationToken);

        if (!hasAccess)
        {
            return OperationResult<TaskSummary>.Failure(
                "Task not found or you do not have access.");
        }

        task.Status = request.Status;
        task.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return OperationResult<TaskSummary>.Success(
            new TaskSummary(
                task.Id,
                task.ProjectId,
                task.Title,
                task.Description,
                task.Status,
                task.Priority,
                task.CreatedAt));
    }
}

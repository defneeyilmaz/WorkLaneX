using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkLaneX.Application.Common.Interfaces;
using WorkLaneX.Application.Common.Mapping;
using WorkLaneX.Application.Common.Models;
using WorkLaneX.Application.Common.Models.Realtime;
using WorkLaneX.Application.Common.Services;

namespace WorkLaneX.Application.Features.Tasks.Commands.DeleteTask;

public class DeleteTaskCommandHandler
    : IRequestHandler<DeleteTaskCommand, OperationResult<bool>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IWorkspaceAuthorizationService _authorization;
    private readonly IUserDirectory _userDirectory;
    private readonly IProjectRealtimeNotifier _realtime;

    public DeleteTaskCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser,
        IWorkspaceAuthorizationService authorization,
        IUserDirectory userDirectory,
        IProjectRealtimeNotifier realtime)
    {
        _context = context;
        _currentUser = currentUser;
        _authorization = authorization;
        _userDirectory = userDirectory;
        _realtime = realtime;
    }

    public async Task<OperationResult<bool>> Handle(
        DeleteTaskCommand request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        if (userId is null)
        {
            return OperationResult<bool>.Failure("You must be signed in.");
        }

        var task = await _context.TaskItems
            .Include(t => t.Project)
            .FirstOrDefaultAsync(t => t.Id == request.TaskId, cancellationToken);

        if (task is null)
        {
            return OperationResult<bool>.Failure(
                "Task not found or you do not have access.");
        }

        var membership = await _authorization.GetMembershipAsync(
            task.Project.WorkspaceId,
            userId.Value,
            cancellationToken);

        if (membership is null || !_authorization.CanManageTasks(membership.Role))
        {
            return OperationResult<bool>.Failure(
                "You do not have permission to delete tasks.");
        }

        var userNames = await _userDirectory.GetFullNamesAsync(
            task.AssigneeId is Guid id ? [id] : [],
            cancellationToken);

        var summary = TaskSummaryMapper.ToSummary(task, userNames);

        _context.TaskItems.Remove(task);
        await _context.SaveChangesAsync(cancellationToken);

        await ProjectRealtimePublisher.SendTaskEventAsync(
            _realtime,
            userId.Value,
            summary,
            RealtimeEventNames.TaskDeleted,
            cancellationToken);

        return OperationResult<bool>.Success(true);
    }
}

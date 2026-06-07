using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkLaneX.Application.Common.Interfaces;
using WorkLaneX.Application.Common.Mapping;
using WorkLaneX.Application.Common.Models;
using WorkLaneX.Application.Common.Models.Realtime;
using WorkLaneX.Application.Common.Services;
using WorkLaneX.Domain.Enums;

namespace WorkLaneX.Application.Features.Tasks.Commands.ApproveTask;

public class ApproveTaskCommandHandler
    : IRequestHandler<ApproveTaskCommand, OperationResult<TaskSummary>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IWorkspaceAuthorizationService _authorization;
    private readonly IUserDirectory _userDirectory;
    private readonly IActivityLogService _activityLog;
    private readonly IProjectRealtimeNotifier _realtime;

    public ApproveTaskCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser,
        IWorkspaceAuthorizationService authorization,
        IUserDirectory userDirectory,
        IActivityLogService activityLog,
        IProjectRealtimeNotifier realtime)
    {
        _context = context;
        _currentUser = currentUser;
        _authorization = authorization;
        _userDirectory = userDirectory;
        _activityLog = activityLog;
        _realtime = realtime;
    }

    public async Task<OperationResult<TaskSummary>> Handle(
        ApproveTaskCommand request,
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

        var project = await _context.Projects
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == task.ProjectId, cancellationToken);

        if (project is null)
        {
            return OperationResult<TaskSummary>.Failure("Task not found.");
        }

        var membership = await _authorization.GetMembershipAsync(
            project.WorkspaceId,
            userId.Value,
            cancellationToken);

        if (membership is null || !_authorization.CanApproveTasks(membership.Role))
        {
            return OperationResult<TaskSummary>.Failure(
                "You do not have permission to approve tasks.");
        }

        if (task.ApprovalStatus != TaskApprovalStatus.Pending)
        {
            return OperationResult<TaskSummary>.Failure(
                "Only pending tasks can be approved.");
        }

        task.ApprovalStatus = TaskApprovalStatus.Approved;
        task.ApprovedAt = DateTime.UtcNow;
        task.ApprovedById = userId.Value;
        task.RejectionNote = null;
        task.UpdatedAt = DateTime.UtcNow;

        _activityLog.Record(
            task.Id,
            project.Id,
            project.WorkspaceId,
            userId.Value,
            ActivityActionType.TaskApproved);

        await _context.SaveChangesAsync(cancellationToken);

        var userNames = await _userDirectory.GetFullNamesAsync(
            task.AssigneeId is Guid assigneeId ? [assigneeId] : [],
            cancellationToken);

        var summary = TaskSummaryMapper.ToSummary(task, userNames);

        await ProjectRealtimePublisher.SendTaskEventAsync(
            _realtime,
            userId.Value,
            summary,
            RealtimeEventNames.TaskUpdated,
            cancellationToken);

        return OperationResult<TaskSummary>.Success(summary);
    }
}

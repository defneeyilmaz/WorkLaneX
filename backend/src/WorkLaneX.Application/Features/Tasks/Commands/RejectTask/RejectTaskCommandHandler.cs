using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkLaneX.Application.Common.Interfaces;
using WorkLaneX.Application.Common.Mapping;
using WorkLaneX.Application.Common.Models;
using WorkLaneX.Domain.Enums;
using TaskStatusEnum = WorkLaneX.Domain.Enums.TaskStatus;

namespace WorkLaneX.Application.Features.Tasks.Commands.RejectTask;

public class RejectTaskCommandHandler
    : IRequestHandler<RejectTaskCommand, OperationResult<TaskSummary>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IWorkspaceAuthorizationService _authorization;
    private readonly IUserDirectory _userDirectory;
    private readonly IActivityLogService _activityLog;

    public RejectTaskCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser,
        IWorkspaceAuthorizationService authorization,
        IUserDirectory userDirectory,
        IActivityLogService activityLog)
    {
        _context = context;
        _currentUser = currentUser;
        _authorization = authorization;
        _userDirectory = userDirectory;
        _activityLog = activityLog;
    }

    public async Task<OperationResult<TaskSummary>> Handle(
        RejectTaskCommand request,
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
                "You do not have permission to reject tasks.");
        }

        if (task.ApprovalStatus != TaskApprovalStatus.Pending)
        {
            return OperationResult<TaskSummary>.Failure(
                "Only pending tasks can be rejected.");
        }

        task.Status = TaskStatusEnum.ToDo;
        task.ApprovalStatus = TaskApprovalStatus.Rejected;
        task.RejectionNote = request.RejectionNote.Trim();
        task.ApprovedAt = null;
        task.ApprovedById = null;
        task.UpdatedAt = DateTime.UtcNow;

        var notePreview = task.RejectionNote.Length > 120
            ? task.RejectionNote[..120] + "…"
            : task.RejectionNote;

        _activityLog.Record(
            task.Id,
            project.Id,
            project.WorkspaceId,
            userId.Value,
            ActivityActionType.TaskRejected,
            notePreview);

        await _context.SaveChangesAsync(cancellationToken);

        var userNames = await _userDirectory.GetFullNamesAsync(
            task.AssigneeId is Guid assigneeId ? [assigneeId] : [],
            cancellationToken);

        return OperationResult<TaskSummary>.Success(
            TaskSummaryMapper.ToSummary(task, userNames));
    }
}

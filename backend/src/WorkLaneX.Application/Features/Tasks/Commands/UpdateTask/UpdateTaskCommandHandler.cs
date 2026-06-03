using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkLaneX.Application.Common.Interfaces;
using WorkLaneX.Application.Common.Mapping;
using WorkLaneX.Application.Common.Models;
using WorkLaneX.Domain.Entities;
using WorkLaneX.Domain.Enums;
using TaskStatusEnum = WorkLaneX.Domain.Enums.TaskStatus;

namespace WorkLaneX.Application.Features.Tasks.Commands.UpdateTask;

public class UpdateTaskCommandHandler
    : IRequestHandler<UpdateTaskCommand, OperationResult<TaskSummary>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IWorkspaceAuthorizationService _authorization;
    private readonly IUserDirectory _userDirectory;
    private readonly IActivityLogService _activityLog;

    public UpdateTaskCommandHandler(
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
        UpdateTaskCommand request,
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

        if (membership is null)
        {
            return OperationResult<TaskSummary>.Failure(
                "Task not found or you do not have access.");
        }

        if (membership.Role == WorkspaceRole.Member)
        {
            return await HandleMemberUpdate(
                task,
                membership,
                userId.Value,
                request,
                cancellationToken);
        }

        if (!_authorization.CanManageTasks(membership.Role))
        {
            return OperationResult<TaskSummary>.Failure(
                "You do not have permission to update tasks.");
        }

        if (request.AssigneeId is Guid assigneeId)
        {
            var assigneeMember = await _authorization.GetMembershipAsync(
                project.WorkspaceId,
                assigneeId,
                cancellationToken);

            if (assigneeMember is null)
            {
                return OperationResult<TaskSummary>.Failure(
                    "Assignee must be a member of this workspace.");
            }
        }

        var previousStatus = task.Status;

        task.Title = request.Title.Trim();
        task.Description = string.IsNullOrWhiteSpace(request.Description)
            ? null
            : request.Description.Trim();
        task.Priority = request.Priority;
        task.Status = request.Status;
        task.AssigneeId = request.AssigneeId;

        if (previousStatus != request.Status)
        {
            var maxSortOrder = await _context.TaskItems
                .Where(t =>
                    t.ProjectId == task.ProjectId &&
                    t.Status == request.Status &&
                    t.Id != task.Id)
                .Select(t => (int?)t.SortOrder)
                .MaxAsync(cancellationToken) ?? 0;
            task.SortOrder = maxSortOrder + 1000;
        }

        if (request.Status != TaskStatusEnum.Done)
        {
            task.ApprovalStatus = TaskApprovalStatus.None;
            task.CompletionNote = null;
            task.RejectionNote = null;
            task.ApprovedAt = null;
            task.ApprovedById = null;
        }

        task.UpdatedAt = DateTime.UtcNow;

        RecordTaskUpdateActivity(
            task,
            project.Id,
            project.WorkspaceId,
            userId.Value,
            previousStatus,
            request.Status);

        await _context.SaveChangesAsync(cancellationToken);

        return await BuildSummaryAsync(task, cancellationToken);
    }

    private async Task<OperationResult<TaskSummary>> HandleMemberUpdate(
        TaskItem task,
        WorkspaceMember membership,
        Guid userId,
        UpdateTaskCommand request,
        CancellationToken cancellationToken)
    {
        if (!_authorization.CanMemberModifyTask(task, userId))
        {
            return OperationResult<TaskSummary>.Failure(
                "You can only update tasks assigned to you.");
        }

        if (!_authorization.IsForwardStatusTransition(task.Status, request.Status))
        {
            return OperationResult<TaskSummary>.Failure(
                "You can only move a task forward to a later status.");
        }

        var project = await _context.Projects
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == task.ProjectId, cancellationToken);

        if (project is null)
        {
            return OperationResult<TaskSummary>.Failure("Task not found.");
        }

        var previousStatus = task.Status;
        task.Status = request.Status;
        task.UpdatedAt = DateTime.UtcNow;

        if (previousStatus != request.Status)
        {
            var maxSortOrder = await _context.TaskItems
                .Where(t =>
                    t.ProjectId == task.ProjectId &&
                    t.Status == request.Status &&
                    t.Id != task.Id)
                .Select(t => (int?)t.SortOrder)
                .MaxAsync(cancellationToken) ?? 0;
            task.SortOrder = maxSortOrder + 1000;
        }

        if (request.Status == TaskStatusEnum.Done)
        {
            task.ApprovalStatus = TaskApprovalStatus.Pending;
            task.CompletionNote = string.IsNullOrWhiteSpace(request.CompletionNote)
                ? null
                : request.CompletionNote.Trim();
            task.RejectionNote = null;
            task.ApprovedAt = null;
            task.ApprovedById = null;
        }

        RecordTaskUpdateActivity(
            task,
            project.Id,
            project.WorkspaceId,
            userId,
            previousStatus,
            request.Status);

        await _context.SaveChangesAsync(cancellationToken);
        return await BuildSummaryAsync(task, cancellationToken);
    }

    private void RecordTaskUpdateActivity(
        TaskItem task,
        Guid projectId,
        Guid workspaceId,
        Guid actorId,
        TaskStatusEnum previousStatus,
        TaskStatusEnum newStatus)
    {
        if (previousStatus != newStatus)
        {
            _activityLog.Record(
                task.Id,
                projectId,
                workspaceId,
                actorId,
                ActivityActionType.TaskStatusChanged,
                ActivityLogFormatter.FormatStatusChange(previousStatus, newStatus));
        }
        else
        {
            _activityLog.Record(
                task.Id,
                projectId,
                workspaceId,
                actorId,
                ActivityActionType.TaskUpdated,
                "updated task details");
        }
    }

    private async Task<OperationResult<TaskSummary>> BuildSummaryAsync(
        TaskItem task,
        CancellationToken cancellationToken)
    {
        var userIds = new List<Guid>();
        if (task.AssigneeId is Guid assigneeId)
        {
            userIds.Add(assigneeId);
        }

        var userNames = await _userDirectory.GetFullNamesAsync(userIds, cancellationToken);
        return OperationResult<TaskSummary>.Success(
            TaskSummaryMapper.ToSummary(task, userNames));
    }
}

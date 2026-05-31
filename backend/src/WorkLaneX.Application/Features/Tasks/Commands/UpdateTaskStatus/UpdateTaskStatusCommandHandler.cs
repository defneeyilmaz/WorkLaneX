using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkLaneX.Application.Common.Interfaces;
using WorkLaneX.Application.Common.Mapping;
using WorkLaneX.Application.Common.Models;
using WorkLaneX.Domain.Enums;
using TaskStatusEnum = WorkLaneX.Domain.Enums.TaskStatus;

namespace WorkLaneX.Application.Features.Tasks.Commands.UpdateTaskStatus;

public class UpdateTaskStatusCommandHandler
    : IRequestHandler<UpdateTaskStatusCommand, OperationResult<TaskSummary>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IWorkspaceAuthorizationService _authorization;
    private readonly IUserDirectory _userDirectory;

    public UpdateTaskStatusCommandHandler(
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
            if (!_authorization.CanMemberModifyTask(task, userId.Value))
            {
                return OperationResult<TaskSummary>.Failure(
                    "You can only update tasks assigned to you.");
            }

            if (!_authorization.IsForwardStatusTransition(task.Status, request.Status))
            {
                return OperationResult<TaskSummary>.Failure(
                    "You can only move a task forward to a later status.");
            }
        }
        else if (!_authorization.CanManageTasks(membership.Role))
        {
            return OperationResult<TaskSummary>.Failure(
                "You do not have permission to update tasks.");
        }

        task.Status = request.Status;
        task.UpdatedAt = DateTime.UtcNow;

        if (request.Status == TaskStatusEnum.Done)
        {
            if (membership.Role == WorkspaceRole.Member)
            {
                task.ApprovalStatus = TaskApprovalStatus.Pending;
                task.CompletionNote = string.IsNullOrWhiteSpace(request.CompletionNote)
                    ? null
                    : request.CompletionNote.Trim();
            }
            else
            {
                task.ApprovalStatus = TaskApprovalStatus.Approved;
                task.ApprovedAt = DateTime.UtcNow;
                task.ApprovedById = userId.Value;
            }

            task.RejectionNote = null;
        }
        else
        {
            task.ApprovalStatus = TaskApprovalStatus.None;
            task.CompletionNote = null;
            task.RejectionNote = null;
            task.ApprovedAt = null;
            task.ApprovedById = null;
        }

        await _context.SaveChangesAsync(cancellationToken);

        var userNames = await _userDirectory.GetFullNamesAsync(
            task.AssigneeId is Guid assigneeId ? [assigneeId] : [],
            cancellationToken);

        return OperationResult<TaskSummary>.Success(
            TaskSummaryMapper.ToSummary(task, userNames));
    }
}

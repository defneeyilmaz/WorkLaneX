using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkLaneX.Application.Common.Interfaces;
using WorkLaneX.Application.Common.Mapping;
using WorkLaneX.Application.Common.Models;
using WorkLaneX.Application.Common.Models.Realtime;
using WorkLaneX.Application.Common.Services;
using WorkLaneX.Domain.Entities;
using WorkLaneX.Domain.Enums;
using TaskStatusEnum = WorkLaneX.Domain.Enums.TaskStatus;

namespace WorkLaneX.Application.Features.Tasks.Commands.CreateTask;

public class CreateTaskCommandHandler
    : IRequestHandler<CreateTaskCommand, OperationResult<TaskSummary>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IWorkspaceAuthorizationService _authorization;
    private readonly IUserDirectory _userDirectory;
    private readonly IActivityLogService _activityLog;
    private readonly IProjectRealtimeNotifier _realtime;

    public CreateTaskCommandHandler(
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
        CreateTaskCommand request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        if (userId is null)
        {
            return OperationResult<TaskSummary>.Failure("You must be signed in.");
        }

        var project = await _context.Projects
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == request.ProjectId, cancellationToken);

        if (project is null)
        {
            return OperationResult<TaskSummary>.Failure(
                "Project not found or you do not have access.");
        }

        var membership = await _authorization.GetMembershipAsync(
            project.WorkspaceId,
            userId.Value,
            cancellationToken);

        if (membership is null || !_authorization.CanManageTasks(membership.Role))
        {
            return OperationResult<TaskSummary>.Failure(
                "You do not have permission to create tasks.");
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

        var maxSortOrder = await _context.TaskItems
            .Where(t => t.ProjectId == request.ProjectId && t.Status == TaskStatusEnum.ToDo)
            .Select(t => (int?)t.SortOrder)
            .MaxAsync(cancellationToken) ?? 0;

        var task = new TaskItem
        {
            ProjectId = request.ProjectId,
            Title = request.Title.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description)
                ? null
                : request.Description.Trim(),
            Priority = request.Priority,
            Status = TaskStatusEnum.ToDo,
            SortOrder = maxSortOrder + 1000,
            AssigneeId = request.AssigneeId,
        };

        _context.TaskItems.Add(task);

        _activityLog.Record(
            task.Id,
            project.Id,
            project.WorkspaceId,
            userId.Value,
            ActivityActionType.TaskCreated,
            task.Title);

        await _context.SaveChangesAsync(cancellationToken);

        var userNames = await _userDirectory.GetFullNamesAsync(
            task.AssigneeId is Guid id ? [id] : [],
            cancellationToken);

        var summary = TaskSummaryMapper.ToSummary(task, userNames);

        await ProjectRealtimePublisher.SendTaskEventAsync(
            _realtime,
            userId.Value,
            summary,
            RealtimeEventNames.TaskCreated,
            cancellationToken);

        return OperationResult<TaskSummary>.Success(summary);
    }
}

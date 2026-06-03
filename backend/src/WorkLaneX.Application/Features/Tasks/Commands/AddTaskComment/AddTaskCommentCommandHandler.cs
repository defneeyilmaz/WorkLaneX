using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkLaneX.Application.Common.Interfaces;
using WorkLaneX.Application.Common.Models;
using WorkLaneX.Domain.Entities;
using WorkLaneX.Domain.Enums;

namespace WorkLaneX.Application.Features.Tasks.Commands.AddTaskComment;

public class AddTaskCommentCommandHandler
    : IRequestHandler<AddTaskCommentCommand, OperationResult<TaskCommentSummary>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IWorkspaceAuthorizationService _authorization;
    private readonly IUserDirectory _userDirectory;
    private readonly IActivityLogService _activityLog;

    public AddTaskCommentCommandHandler(
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

    public async Task<OperationResult<TaskCommentSummary>> Handle(
        AddTaskCommentCommand request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        if (userId is null)
        {
            return OperationResult<TaskCommentSummary>.Failure("You must be signed in.");
        }

        var task = await _context.TaskItems
            .Include(t => t.Project)
            .FirstOrDefaultAsync(t => t.Id == request.TaskId, cancellationToken);

        if (task is null)
        {
            return OperationResult<TaskCommentSummary>.Failure(
                "Task not found or you do not have access.");
        }

        var membership = await _authorization.GetMembershipAsync(
            task.Project.WorkspaceId,
            userId.Value,
            cancellationToken);

        if (membership is null)
        {
            return OperationResult<TaskCommentSummary>.Failure(
                "Task not found or you do not have access.");
        }

        var comment = new TaskComment
        {
            TaskId = request.TaskId,
            AuthorId = userId.Value,
            Body = request.Body.Trim(),
        };

        _context.TaskComments.Add(comment);

        var preview = comment.Body.Length > 120 ? comment.Body[..120] + "…" : comment.Body;
        _activityLog.Record(
            task.Id,
            task.ProjectId,
            task.Project.WorkspaceId,
            userId.Value,
            ActivityActionType.TaskCommentAdded,
            preview);

        await _context.SaveChangesAsync(cancellationToken);

        var authorNames = await _userDirectory.GetFullNamesAsync([userId.Value], cancellationToken);

        return OperationResult<TaskCommentSummary>.Success(
            new TaskCommentSummary(
                comment.Id,
                comment.TaskId,
                comment.Body,
                comment.AuthorId,
                authorNames.GetValueOrDefault(comment.AuthorId, "Unknown"),
                comment.CreatedAt));
    }
}

using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkLaneX.Application.Common.Interfaces;
using WorkLaneX.Application.Common.Models;
using WorkLaneX.Domain.Entities;
using TaskStatusEnum = WorkLaneX.Domain.Enums.TaskStatus;

namespace WorkLaneX.Application.Features.Tasks.Commands.CreateTask;

public class CreateTaskCommandHandler
    : IRequestHandler<CreateTaskCommand, OperationResult<TaskSummary>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public CreateTaskCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
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

        var hasAccess = await _context.Projects
            .AnyAsync(
                p => p.Id == request.ProjectId &&
                     p.Workspace.Members.Any(m => m.UserId == userId.Value),
                cancellationToken);

        if (!hasAccess)
        {
            return OperationResult<TaskSummary>.Failure(
                "Project not found or you do not have access.");
        }

        var task = new TaskItem
        {
            ProjectId = request.ProjectId,
            Title = request.Title.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description)
                ? null
                : request.Description.Trim(),
            Priority = request.Priority,
            Status = TaskStatusEnum.ToDo
        };

        _context.TaskItems.Add(task);
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

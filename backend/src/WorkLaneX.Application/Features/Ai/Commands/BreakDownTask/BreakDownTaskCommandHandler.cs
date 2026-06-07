using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using WorkLaneX.Application.Common.Interfaces;
using WorkLaneX.Application.Common.Models;
using WorkLaneX.Application.Common.Settings;

namespace WorkLaneX.Application.Features.Ai.Commands.BreakDownTask;

public class BreakDownTaskCommandHandler
    : IRequestHandler<BreakDownTaskCommand, OperationResult<TaskBreakdownResult>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IWorkspaceAuthorizationService _authorization;
    private readonly IAiTaskBreakdownService _breakdownService;
    private readonly OpenAiSettings _openAiSettings;

    public BreakDownTaskCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser,
        IWorkspaceAuthorizationService authorization,
        IAiTaskBreakdownService breakdownService,
        IOptions<OpenAiSettings> openAiSettings)
    {
        _context = context;
        _currentUser = currentUser;
        _authorization = authorization;
        _breakdownService = breakdownService;
        _openAiSettings = openAiSettings.Value;
    }

    public async Task<OperationResult<TaskBreakdownResult>> Handle(
        BreakDownTaskCommand request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        if (userId is null)
        {
            return OperationResult<TaskBreakdownResult>.Failure("You must be signed in.");
        }

        var task = await _context.TaskItems
            .AsNoTracking()
            .Include(t => t.Project)
            .FirstOrDefaultAsync(t => t.Id == request.TaskId, cancellationToken);

        if (task is null)
        {
            return OperationResult<TaskBreakdownResult>.Failure(
                "Task not found or you do not have access.");
        }

        var membership = await _authorization.GetMembershipAsync(
            task.Project.WorkspaceId,
            userId.Value,
            cancellationToken);

        if (membership is null)
        {
            return OperationResult<TaskBreakdownResult>.Failure(
                "Task not found or you do not have access.");
        }

        try
        {
            var (subtasks, usedMock) = await _breakdownService.BreakDownAsync(
                task.Title,
                task.Description,
                _openAiSettings.MaxSubtasks,
                cancellationToken);

            return OperationResult<TaskBreakdownResult>.Success(
                new TaskBreakdownResult(
                    task.Id,
                    task.Title,
                    usedMock,
                    subtasks));
        }
        catch (Exception)
        {
            return OperationResult<TaskBreakdownResult>.Failure(
                "Could not generate a task breakdown. Try again later.");
        }
    }
}

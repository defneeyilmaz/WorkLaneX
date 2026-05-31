using MediatR;
using WorkLaneX.Application.Common.Models;
using WorkLaneX.Domain.Enums;
using TaskStatusEnum = WorkLaneX.Domain.Enums.TaskStatus;

namespace WorkLaneX.Application.Features.Tasks.Commands.UpdateTaskStatus;

public record UpdateTaskStatusCommand(
    Guid TaskId,
    TaskStatusEnum Status,
    string? CompletionNote = null)
    : IRequest<OperationResult<TaskSummary>>;

using MediatR;
using WorkLaneX.Application.Common.Models;
using TaskStatusEnum = WorkLaneX.Domain.Enums.TaskStatus;

namespace WorkLaneX.Application.Features.Tasks.Commands.MoveTask;

public record MoveTaskCommand(
    Guid TaskId,
    TaskStatusEnum Status,
    int SortOrder)
    : IRequest<OperationResult<TaskSummary>>;

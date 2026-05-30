using MediatR;
using WorkLaneX.Application.Common.Models;
using WorkLaneX.Domain.Enums;
using TaskStatusEnum = WorkLaneX.Domain.Enums.TaskStatus;

namespace WorkLaneX.Application.Features.Tasks.Commands.UpdateTask;

public record UpdateTaskCommand(
    Guid TaskId,
    string Title,
    string? Description,
    TaskPriority Priority,
    TaskStatusEnum Status) : IRequest<OperationResult<TaskSummary>>;

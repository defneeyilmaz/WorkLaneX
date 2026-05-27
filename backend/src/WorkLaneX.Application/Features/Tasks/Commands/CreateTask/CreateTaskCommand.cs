using MediatR;
using WorkLaneX.Application.Common.Models;
using WorkLaneX.Domain.Enums;

namespace WorkLaneX.Application.Features.Tasks.Commands.CreateTask;

public record CreateTaskCommand(
    Guid ProjectId,
    string Title,
    string? Description,
    TaskPriority Priority) : IRequest<OperationResult<TaskSummary>>;

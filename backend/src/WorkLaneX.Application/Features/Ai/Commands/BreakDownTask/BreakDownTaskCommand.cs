using MediatR;
using WorkLaneX.Application.Common.Models;

namespace WorkLaneX.Application.Features.Ai.Commands.BreakDownTask;

public record BreakDownTaskCommand(Guid TaskId)
    : IRequest<OperationResult<TaskBreakdownResult>>;

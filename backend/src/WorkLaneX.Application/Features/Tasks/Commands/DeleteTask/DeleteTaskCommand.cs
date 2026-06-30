using MediatR;
using WorkLaneX.Application.Common.Models;

namespace WorkLaneX.Application.Features.Tasks.Commands.DeleteTask;

public record DeleteTaskCommand(Guid TaskId)
    : IRequest<OperationResult<bool>>;

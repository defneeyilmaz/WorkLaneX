using MediatR;
using WorkLaneX.Application.Common.Models;

namespace WorkLaneX.Application.Features.Tasks.Commands.ApproveTask;

public record ApproveTaskCommand(Guid TaskId) : IRequest<OperationResult<TaskSummary>>;

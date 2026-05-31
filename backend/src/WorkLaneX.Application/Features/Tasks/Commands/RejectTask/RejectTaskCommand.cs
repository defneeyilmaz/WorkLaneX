using MediatR;
using WorkLaneX.Application.Common.Models;

namespace WorkLaneX.Application.Features.Tasks.Commands.RejectTask;

public record RejectTaskCommand(Guid TaskId, string RejectionNote)
    : IRequest<OperationResult<TaskSummary>>;

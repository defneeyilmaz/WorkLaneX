using MediatR;
using WorkLaneX.Application.Common.Models;

namespace WorkLaneX.Application.Features.Tasks.Commands.AddTaskComment;

public record AddTaskCommentCommand(Guid TaskId, string Body)
    : IRequest<OperationResult<TaskCommentSummary>>;

using MediatR;
using WorkLaneX.Application.Common.Models;

namespace WorkLaneX.Application.Features.Tasks.Queries.ListTaskComments;

public record ListTaskCommentsQuery(Guid TaskId)
    : IRequest<OperationResult<IReadOnlyList<TaskCommentSummary>>>;

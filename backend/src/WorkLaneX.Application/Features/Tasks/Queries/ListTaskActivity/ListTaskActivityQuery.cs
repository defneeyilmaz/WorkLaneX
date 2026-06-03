using MediatR;
using WorkLaneX.Application.Common.Models;

namespace WorkLaneX.Application.Features.Tasks.Queries.ListTaskActivity;

public record ListTaskActivityQuery(Guid TaskId)
    : IRequest<OperationResult<IReadOnlyList<ActivityLogSummary>>>;

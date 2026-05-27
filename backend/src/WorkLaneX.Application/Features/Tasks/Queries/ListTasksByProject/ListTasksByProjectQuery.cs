using MediatR;
using WorkLaneX.Application.Common.Models;

namespace WorkLaneX.Application.Features.Tasks.Queries.ListTasksByProject;

public record ListTasksByProjectQuery(Guid ProjectId)
    : IRequest<OperationResult<IReadOnlyList<TaskSummary>>>;

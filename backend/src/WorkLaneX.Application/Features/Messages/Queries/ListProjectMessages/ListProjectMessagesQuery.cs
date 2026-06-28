using MediatR;
using WorkLaneX.Application.Common.Models;

namespace WorkLaneX.Application.Features.Messages.Queries.ListProjectMessages;

public record ListProjectMessagesQuery(Guid ProjectId)
    : IRequest<OperationResult<IReadOnlyList<ProjectMessageSummary>>>;

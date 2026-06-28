using MediatR;
using WorkLaneX.Application.Common.Models;

namespace WorkLaneX.Application.Features.Messages.Commands.CreateProjectMessage;

public record CreateProjectMessageCommand(Guid ProjectId, string Body)
    : IRequest<OperationResult<ProjectMessageSummary>>;

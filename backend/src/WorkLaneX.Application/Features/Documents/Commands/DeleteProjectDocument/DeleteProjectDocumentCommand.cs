using MediatR;
using WorkLaneX.Application.Common.Models;

namespace WorkLaneX.Application.Features.Documents.Commands.DeleteProjectDocument;

public record DeleteProjectDocumentCommand(Guid DocumentId)
    : IRequest<OperationResult<bool>>;

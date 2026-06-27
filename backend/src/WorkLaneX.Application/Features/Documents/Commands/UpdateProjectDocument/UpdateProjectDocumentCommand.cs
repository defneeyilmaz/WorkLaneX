using MediatR;
using WorkLaneX.Application.Common.Models;

namespace WorkLaneX.Application.Features.Documents.Commands.UpdateProjectDocument;

public record UpdateProjectDocumentCommand(
    Guid DocumentId,
    string? Title,
    string? Content,
    DateTime? MeetingHeldAt = null)
    : IRequest<OperationResult<ProjectDocumentDetail>>;

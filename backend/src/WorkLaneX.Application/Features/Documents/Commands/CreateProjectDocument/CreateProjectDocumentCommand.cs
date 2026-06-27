using MediatR;
using WorkLaneX.Application.Common.Models;
using WorkLaneX.Domain.Enums;

namespace WorkLaneX.Application.Features.Documents.Commands.CreateProjectDocument;

public record CreateProjectDocumentCommand(
    Guid ProjectId,
    string Title,
    string? Content,
    DocumentType Type = DocumentType.Spec,
    DateTime? MeetingHeldAt = null)
    : IRequest<OperationResult<ProjectDocumentDetail>>;

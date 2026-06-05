using MediatR;
using WorkLaneX.Application.Common.Models;

namespace WorkLaneX.Application.Features.Documents.Commands.CreateProjectDocument;

public record CreateProjectDocumentCommand(
    Guid ProjectId,
    string Title,
    string? Content)
    : IRequest<OperationResult<ProjectDocumentDetail>>;

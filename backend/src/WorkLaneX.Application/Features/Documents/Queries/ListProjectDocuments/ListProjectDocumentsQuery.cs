using MediatR;
using WorkLaneX.Application.Common.Models;

namespace WorkLaneX.Application.Features.Documents.Queries.ListProjectDocuments;

public record ListProjectDocumentsQuery(Guid ProjectId, string? Type = null)
    : IRequest<OperationResult<IReadOnlyList<ProjectDocumentSummary>>>;

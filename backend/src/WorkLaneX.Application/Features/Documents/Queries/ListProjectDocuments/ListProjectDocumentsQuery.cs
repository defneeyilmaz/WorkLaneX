using MediatR;
using WorkLaneX.Application.Common.Models;

namespace WorkLaneX.Application.Features.Documents.Queries.ListProjectDocuments;

public record ListProjectDocumentsQuery(Guid ProjectId)
    : IRequest<OperationResult<IReadOnlyList<ProjectDocumentSummary>>>;

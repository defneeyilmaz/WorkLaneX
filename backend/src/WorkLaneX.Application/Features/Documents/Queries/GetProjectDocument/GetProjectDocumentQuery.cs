using MediatR;
using WorkLaneX.Application.Common.Models;

namespace WorkLaneX.Application.Features.Documents.Queries.GetProjectDocument;

public record GetProjectDocumentQuery(Guid DocumentId)
    : IRequest<OperationResult<ProjectDocumentDetail>>;

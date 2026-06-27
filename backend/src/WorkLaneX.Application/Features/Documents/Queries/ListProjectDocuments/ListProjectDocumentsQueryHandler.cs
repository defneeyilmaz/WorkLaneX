using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkLaneX.Application.Common.Interfaces;
using WorkLaneX.Application.Common.Models;
using WorkLaneX.Domain.Enums;

namespace WorkLaneX.Application.Features.Documents.Queries.ListProjectDocuments;

public class ListProjectDocumentsQueryHandler
    : IRequestHandler<ListProjectDocumentsQuery, OperationResult<IReadOnlyList<ProjectDocumentSummary>>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IWorkspaceAuthorizationService _authorization;
    private readonly IUserDirectory _userDirectory;

    public ListProjectDocumentsQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser,
        IWorkspaceAuthorizationService authorization,
        IUserDirectory userDirectory)
    {
        _context = context;
        _currentUser = currentUser;
        _authorization = authorization;
        _userDirectory = userDirectory;
    }

    public async Task<OperationResult<IReadOnlyList<ProjectDocumentSummary>>> Handle(
        ListProjectDocumentsQuery request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        if (userId is null)
        {
            return OperationResult<IReadOnlyList<ProjectDocumentSummary>>.Failure(
                "You must be signed in.");
        }

        var project = await _context.Projects
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == request.ProjectId, cancellationToken);

        if (project is null)
        {
            return OperationResult<IReadOnlyList<ProjectDocumentSummary>>.Failure(
                "Project not found or you do not have access.");
        }

        var membership = await _authorization.GetMembershipAsync(
            project.WorkspaceId,
            userId.Value,
            cancellationToken);

        if (membership is null)
        {
            return OperationResult<IReadOnlyList<ProjectDocumentSummary>>.Failure(
                "Project not found or you do not have access.");
        }

        var documentsQuery = _context.ProjectDocuments
            .AsNoTracking()
            .Where(d => d.ProjectId == request.ProjectId);

        if (!string.IsNullOrWhiteSpace(request.Type))
        {
            if (!Enum.TryParse<DocumentType>(request.Type, ignoreCase: true, out var documentType))
            {
                return OperationResult<IReadOnlyList<ProjectDocumentSummary>>.Failure(
                    "Invalid document type.");
            }

            documentsQuery = documentsQuery.Where(d => d.Type == documentType);
        }

        var documents = await documentsQuery
            .OrderByDescending(d => d.MeetingHeldAt ?? d.UpdatedAt ?? d.CreatedAt)
            .ThenByDescending(d => d.UpdatedAt ?? d.CreatedAt)
            .ThenByDescending(d => d.CreatedAt)
            .ToListAsync(cancellationToken);

        var authorIds = documents.Select(d => d.AuthorId).Distinct();
        var authorNames = await _userDirectory.GetFullNamesAsync(authorIds, cancellationToken);

        var summaries = documents
            .Select(d => new ProjectDocumentSummary(
                d.Id,
                d.ProjectId,
                d.Title,
                d.Type.ToString(),
                d.MeetingHeldAt,
                d.AuthorId,
                authorNames.GetValueOrDefault(d.AuthorId, "Unknown"),
                d.CreatedAt,
                d.UpdatedAt))
            .ToList();

        return OperationResult<IReadOnlyList<ProjectDocumentSummary>>.Success(summaries);
    }
}

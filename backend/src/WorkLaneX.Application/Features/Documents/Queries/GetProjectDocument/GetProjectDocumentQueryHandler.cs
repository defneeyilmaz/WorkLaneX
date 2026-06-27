using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkLaneX.Application.Common.Interfaces;
using WorkLaneX.Application.Common.Models;

namespace WorkLaneX.Application.Features.Documents.Queries.GetProjectDocument;

public class GetProjectDocumentQueryHandler
    : IRequestHandler<GetProjectDocumentQuery, OperationResult<ProjectDocumentDetail>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IWorkspaceAuthorizationService _authorization;
    private readonly IUserDirectory _userDirectory;

    public GetProjectDocumentQueryHandler(
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

    public async Task<OperationResult<ProjectDocumentDetail>> Handle(
        GetProjectDocumentQuery request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        if (userId is null)
        {
            return OperationResult<ProjectDocumentDetail>.Failure("You must be signed in.");
        }

        var document = await _context.ProjectDocuments
            .AsNoTracking()
            .Include(d => d.Project)
            .FirstOrDefaultAsync(d => d.Id == request.DocumentId, cancellationToken);

        if (document is null)
        {
            return OperationResult<ProjectDocumentDetail>.Failure(
                "Document not found or you do not have access.");
        }

        var membership = await _authorization.GetMembershipAsync(
            document.Project.WorkspaceId,
            userId.Value,
            cancellationToken);

        if (membership is null)
        {
            return OperationResult<ProjectDocumentDetail>.Failure(
                "Document not found or you do not have access.");
        }

        var authorNames = await _userDirectory.GetFullNamesAsync(
            [document.AuthorId],
            cancellationToken);

        return OperationResult<ProjectDocumentDetail>.Success(
            new ProjectDocumentDetail(
                document.Id,
                document.ProjectId,
                document.Title,
                document.Content,
                document.Type.ToString(),
                document.MeetingHeldAt,
                document.AuthorId,
                authorNames.GetValueOrDefault(document.AuthorId, "Unknown"),
                document.CreatedAt,
                document.UpdatedAt));
    }
}

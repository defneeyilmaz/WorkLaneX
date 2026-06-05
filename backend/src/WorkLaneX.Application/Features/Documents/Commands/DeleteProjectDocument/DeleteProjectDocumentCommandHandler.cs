using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkLaneX.Application.Common.Interfaces;
using WorkLaneX.Application.Common.Models;

namespace WorkLaneX.Application.Features.Documents.Commands.DeleteProjectDocument;

public class DeleteProjectDocumentCommandHandler
    : IRequestHandler<DeleteProjectDocumentCommand, OperationResult<bool>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IWorkspaceAuthorizationService _authorization;

    public DeleteProjectDocumentCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser,
        IWorkspaceAuthorizationService authorization)
    {
        _context = context;
        _currentUser = currentUser;
        _authorization = authorization;
    }

    public async Task<OperationResult<bool>> Handle(
        DeleteProjectDocumentCommand request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        if (userId is null)
        {
            return OperationResult<bool>.Failure("You must be signed in.");
        }

        var document = await _context.ProjectDocuments
            .Include(d => d.Project)
            .FirstOrDefaultAsync(d => d.Id == request.DocumentId, cancellationToken);

        if (document is null)
        {
            return OperationResult<bool>.Failure(
                "Document not found or you do not have access.");
        }

        var membership = await _authorization.GetMembershipAsync(
            document.Project.WorkspaceId,
            userId.Value,
            cancellationToken);

        if (membership is null)
        {
            return OperationResult<bool>.Failure(
                "Document not found or you do not have access.");
        }

        var canDelete = document.AuthorId == userId.Value
            || _authorization.CanManageProjects(membership.Role);

        if (!canDelete)
        {
            return OperationResult<bool>.Failure(
                "You do not have permission to delete this document.");
        }

        _context.ProjectDocuments.Remove(document);
        await _context.SaveChangesAsync(cancellationToken);

        return OperationResult<bool>.Success(true);
    }
}

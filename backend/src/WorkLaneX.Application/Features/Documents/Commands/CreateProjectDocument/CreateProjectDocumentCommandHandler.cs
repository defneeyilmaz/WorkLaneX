using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkLaneX.Application.Common.Interfaces;
using WorkLaneX.Application.Common.Models;
using WorkLaneX.Domain.Entities;
using WorkLaneX.Domain.Enums;

namespace WorkLaneX.Application.Features.Documents.Commands.CreateProjectDocument;

public class CreateProjectDocumentCommandHandler
    : IRequestHandler<CreateProjectDocumentCommand, OperationResult<ProjectDocumentDetail>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IWorkspaceAuthorizationService _authorization;
    private readonly IUserDirectory _userDirectory;

    public CreateProjectDocumentCommandHandler(
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
        CreateProjectDocumentCommand request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        if (userId is null)
        {
            return OperationResult<ProjectDocumentDetail>.Failure("You must be signed in.");
        }

        var project = await _context.Projects
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == request.ProjectId, cancellationToken);

        if (project is null)
        {
            return OperationResult<ProjectDocumentDetail>.Failure(
                "Project not found or you do not have access.");
        }

        var membership = await _authorization.GetMembershipAsync(
            project.WorkspaceId,
            userId.Value,
            cancellationToken);

        if (membership is null)
        {
            return OperationResult<ProjectDocumentDetail>.Failure(
                "Project not found or you do not have access.");
        }

        var document = new ProjectDocument
        {
            ProjectId = request.ProjectId,
            AuthorId = userId.Value,
            Title = request.Title.Trim(),
            Content = string.IsNullOrWhiteSpace(request.Content)
                ? string.Empty
                : request.Content.Trim(),
            Type = request.Type,
            MeetingHeldAt = request.Type == DocumentType.MeetingNote
                ? request.MeetingHeldAt
                : null,
        };

        _context.ProjectDocuments.Add(document);
        await _context.SaveChangesAsync(cancellationToken);

        var authorNames = await _userDirectory.GetFullNamesAsync([userId.Value], cancellationToken);

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

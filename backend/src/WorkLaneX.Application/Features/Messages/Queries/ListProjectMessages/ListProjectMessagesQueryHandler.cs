using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkLaneX.Application.Common.Interfaces;
using WorkLaneX.Application.Common.Models;

namespace WorkLaneX.Application.Features.Messages.Queries.ListProjectMessages;

public class ListProjectMessagesQueryHandler
    : IRequestHandler<ListProjectMessagesQuery, OperationResult<IReadOnlyList<ProjectMessageSummary>>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IWorkspaceAuthorizationService _authorization;
    private readonly IUserDirectory _userDirectory;

    public ListProjectMessagesQueryHandler(
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

    public async Task<OperationResult<IReadOnlyList<ProjectMessageSummary>>> Handle(
        ListProjectMessagesQuery request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        if (userId is null)
        {
            return OperationResult<IReadOnlyList<ProjectMessageSummary>>.Failure(
                "You must be signed in.");
        }

        var project = await _context.Projects
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == request.ProjectId, cancellationToken);

        if (project is null)
        {
            return OperationResult<IReadOnlyList<ProjectMessageSummary>>.Failure(
                "Project not found or you do not have access.");
        }

        var membership = await _authorization.GetMembershipAsync(
            project.WorkspaceId,
            userId.Value,
            cancellationToken);

        if (membership is null)
        {
            return OperationResult<IReadOnlyList<ProjectMessageSummary>>.Failure(
                "Project not found or you do not have access.");
        }

        var messages = await _context.ProjectMessages
            .AsNoTracking()
            .Where(m => m.ProjectId == request.ProjectId)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync(cancellationToken);

        var authorIds = messages.Select(m => m.AuthorId).Distinct();
        var authorNames = await _userDirectory.GetFullNamesAsync(authorIds, cancellationToken);

        var summaries = messages
            .Select(m => new ProjectMessageSummary(
                m.Id,
                m.ProjectId,
                m.Body,
                m.AuthorId,
                authorNames.GetValueOrDefault(m.AuthorId, "Unknown"),
                m.CreatedAt))
            .ToList();

        return OperationResult<IReadOnlyList<ProjectMessageSummary>>.Success(summaries);
    }
}

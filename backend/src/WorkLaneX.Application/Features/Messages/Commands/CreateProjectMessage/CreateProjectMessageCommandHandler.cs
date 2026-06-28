using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkLaneX.Application.Common.Interfaces;
using WorkLaneX.Application.Common.Models;
using WorkLaneX.Application.Common.Models.Realtime;
using WorkLaneX.Domain.Entities;

namespace WorkLaneX.Application.Features.Messages.Commands.CreateProjectMessage;

public class CreateProjectMessageCommandHandler
    : IRequestHandler<CreateProjectMessageCommand, OperationResult<ProjectMessageSummary>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IWorkspaceAuthorizationService _authorization;
    private readonly IUserDirectory _userDirectory;
    private readonly IProjectRealtimeNotifier _realtime;

    public CreateProjectMessageCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser,
        IWorkspaceAuthorizationService authorization,
        IUserDirectory userDirectory,
        IProjectRealtimeNotifier realtime)
    {
        _context = context;
        _currentUser = currentUser;
        _authorization = authorization;
        _userDirectory = userDirectory;
        _realtime = realtime;
    }

    public async Task<OperationResult<ProjectMessageSummary>> Handle(
        CreateProjectMessageCommand request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        if (userId is null)
        {
            return OperationResult<ProjectMessageSummary>.Failure("You must be signed in.");
        }

        var project = await _context.Projects
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == request.ProjectId, cancellationToken);

        if (project is null)
        {
            return OperationResult<ProjectMessageSummary>.Failure(
                "Project not found or you do not have access.");
        }

        var membership = await _authorization.GetMembershipAsync(
            project.WorkspaceId,
            userId.Value,
            cancellationToken);

        if (membership is null)
        {
            return OperationResult<ProjectMessageSummary>.Failure(
                "Project not found or you do not have access.");
        }

        var message = new ProjectMessage
        {
            ProjectId = request.ProjectId,
            AuthorId = userId.Value,
            Body = request.Body.Trim(),
        };

        _context.ProjectMessages.Add(message);
        await _context.SaveChangesAsync(cancellationToken);

        await _realtime.SendToProjectAsync(
            request.ProjectId,
            RealtimeEventNames.MessagePosted,
            new { messageId = message.Id },
            userId.Value,
            cancellationToken);

        var authorNames = await _userDirectory.GetFullNamesAsync([userId.Value], cancellationToken);

        return OperationResult<ProjectMessageSummary>.Success(
            new ProjectMessageSummary(
                message.Id,
                message.ProjectId,
                message.Body,
                message.AuthorId,
                authorNames.GetValueOrDefault(message.AuthorId, "Unknown"),
                message.CreatedAt));
    }
}

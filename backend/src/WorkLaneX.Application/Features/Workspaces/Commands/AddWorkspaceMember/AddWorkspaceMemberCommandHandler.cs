using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkLaneX.Application.Common.Interfaces;
using WorkLaneX.Application.Common.Models;
using WorkLaneX.Domain.Entities;
using WorkLaneX.Domain.Enums;

namespace WorkLaneX.Application.Features.Workspaces.Commands.AddWorkspaceMember;

public class AddWorkspaceMemberCommandHandler
    : IRequestHandler<AddWorkspaceMemberCommand, OperationResult<WorkspaceMemberSummary>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IWorkspaceAuthorizationService _authorization;
    private readonly IUserDirectory _userDirectory;

    public AddWorkspaceMemberCommandHandler(
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

    public async Task<OperationResult<WorkspaceMemberSummary>> Handle(
        AddWorkspaceMemberCommand request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        if (userId is null)
        {
            return OperationResult<WorkspaceMemberSummary>.Failure("You must be signed in.");
        }

        var actorMembership = await _authorization.GetMembershipAsync(
            request.WorkspaceId,
            userId.Value,
            cancellationToken);

        if (actorMembership is null || !_authorization.CanInviteMembers(actorMembership.Role))
        {
            return OperationResult<WorkspaceMemberSummary>.Failure(
                "You do not have permission to add members.");
        }

        if (!_authorization.CanAssignRole(actorMembership.Role, request.Role))
        {
            return OperationResult<WorkspaceMemberSummary>.Failure(
                "You do not have permission to assign this role.");
        }

        var user = await _userDirectory.FindByEmailAsync(request.Email, cancellationToken);
        if (user is null)
        {
            return OperationResult<WorkspaceMemberSummary>.Failure(
                "User not found. They must register first.");
        }

        var existing = await _context.WorkspaceMembers.AnyAsync(
            m => m.WorkspaceId == request.WorkspaceId && m.UserId == user.Id,
            cancellationToken);

        if (existing)
        {
            return OperationResult<WorkspaceMemberSummary>.Failure(
                "User is already a member of this workspace.");
        }

        var membership = new WorkspaceMember
        {
            WorkspaceId = request.WorkspaceId,
            UserId = user.Id,
            Role = request.Role,
        };

        _context.WorkspaceMembers.Add(membership);
        await _context.SaveChangesAsync(cancellationToken);

        return OperationResult<WorkspaceMemberSummary>.Success(
            new WorkspaceMemberSummary(
                user.Id,
                user.Email,
                user.FullName,
                request.Role,
                membership.JoinedAt));
    }
}

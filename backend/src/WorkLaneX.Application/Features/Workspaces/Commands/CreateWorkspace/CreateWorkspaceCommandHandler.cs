using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkLaneX.Application.Common.Interfaces;
using WorkLaneX.Application.Common.Models;
using WorkLaneX.Domain.Entities;
using WorkLaneX.Domain.Enums;

namespace WorkLaneX.Application.Features.Workspaces.Commands.CreateWorkspace;

public class CreateWorkspaceCommandHandler
    : IRequestHandler<CreateWorkspaceCommand, OperationResult<WorkspaceSummary>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public CreateWorkspaceCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<OperationResult<WorkspaceSummary>> Handle(
        CreateWorkspaceCommand request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        if (userId is null)
        {
            return OperationResult<WorkspaceSummary>.Failure("You must be signed in.");
        }

        var workspace = new Workspace
        {
            Name = request.Name.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description)
                ? null
                : request.Description.Trim(),
            OwnerId = userId.Value,
        };

        var membership = new WorkspaceMember
        {
            WorkspaceId = workspace.Id,
            UserId = userId.Value,
            Role = WorkspaceRole.Owner,
        };

        _context.Workspaces.Add(workspace);
        _context.WorkspaceMembers.Add(membership);
        await _context.SaveChangesAsync(cancellationToken);

        return OperationResult<WorkspaceSummary>.Success(
            new WorkspaceSummary(
                workspace.Id,
                workspace.Name,
                workspace.Description,
                WorkspaceRole.Owner,
                workspace.CreatedAt));
    }
}

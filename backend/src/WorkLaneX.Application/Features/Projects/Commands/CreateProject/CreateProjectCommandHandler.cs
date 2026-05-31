using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkLaneX.Application.Common.Interfaces;
using WorkLaneX.Application.Common.Models;
using WorkLaneX.Domain.Enums;

namespace WorkLaneX.Application.Features.Projects.Commands.CreateProject;

public class CreateProjectCommandHandler
    : IRequestHandler<CreateProjectCommand, OperationResult<ProjectSummary>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IWorkspaceAuthorizationService _authorization;

    public CreateProjectCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser,
        IWorkspaceAuthorizationService authorization)
    {
        _context = context;
        _currentUser = currentUser;
        _authorization = authorization;
    }

    public async Task<OperationResult<ProjectSummary>> Handle(
        CreateProjectCommand request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        if (userId is null)
        {
            return OperationResult<ProjectSummary>.Failure("You must be signed in.");
        }

        var membership = await _authorization.GetMembershipAsync(
            request.WorkspaceId,
            userId.Value,
            cancellationToken);

        if (membership is null || !_authorization.CanManageProjects(membership.Role))
        {
            return OperationResult<ProjectSummary>.Failure(
                "You do not have permission to create projects.");
        }

        var project = new Domain.Entities.Project
        {
            WorkspaceId = request.WorkspaceId,
            Name = request.Name.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description)
                ? null
                : request.Description.Trim(),
        };

        _context.Projects.Add(project);
        await _context.SaveChangesAsync(cancellationToken);

        return OperationResult<ProjectSummary>.Success(
            new ProjectSummary(
                project.Id,
                project.WorkspaceId,
                project.Name,
                project.Description,
                project.CreatedAt));
    }
}

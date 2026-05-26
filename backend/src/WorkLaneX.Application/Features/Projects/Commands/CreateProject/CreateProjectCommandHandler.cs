using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkLaneX.Application.Common.Interfaces;
using WorkLaneX.Application.Common.Models;
using WorkLaneX.Domain.Entities;

namespace WorkLaneX.Application.Features.Projects.Commands.CreateProject;

public class CreateProjectCommandHandler
    : IRequestHandler<CreateProjectCommand, OperationResult<ProjectSummary>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public CreateProjectCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
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

        var hasAccess = await _context.WorkspaceMembers.AnyAsync(
            m => m.WorkspaceId == request.WorkspaceId && m.UserId == userId.Value,
            cancellationToken);

        if (!hasAccess)
        {
            return OperationResult<ProjectSummary>.Failure(
                "Workspace not found or you do not have access.");
        }

        var project = new Project
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

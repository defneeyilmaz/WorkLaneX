using MediatR;
using WorkLaneX.Application.Common.Models;

namespace WorkLaneX.Application.Features.Projects.Commands.CreateProject;

public record CreateProjectCommand(Guid WorkspaceId, string Name, string? Description)
    : IRequest<OperationResult<ProjectSummary>>;

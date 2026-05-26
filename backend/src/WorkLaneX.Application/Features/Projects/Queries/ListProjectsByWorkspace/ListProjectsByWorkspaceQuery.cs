using MediatR;
using WorkLaneX.Application.Common.Models;

namespace WorkLaneX.Application.Features.Projects.Queries.ListProjectsByWorkspace;

public record ListProjectsByWorkspaceQuery(Guid WorkspaceId)
    : IRequest<OperationResult<IReadOnlyList<ProjectSummary>>>;

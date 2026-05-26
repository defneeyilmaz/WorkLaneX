using MediatR;
using WorkLaneX.Application.Common.Models;

namespace WorkLaneX.Application.Features.Workspaces.Queries.ListMyWorkspaces;

public record ListMyWorkspacesQuery : IRequest<IReadOnlyList<WorkspaceSummary>>;

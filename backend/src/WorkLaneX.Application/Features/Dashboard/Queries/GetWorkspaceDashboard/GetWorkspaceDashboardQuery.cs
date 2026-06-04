using MediatR;
using WorkLaneX.Application.Common.Models;

namespace WorkLaneX.Application.Features.Dashboard.Queries.GetWorkspaceDashboard;

public record GetWorkspaceDashboardQuery(Guid WorkspaceId)
    : IRequest<OperationResult<WorkspaceDashboardSummary>>;

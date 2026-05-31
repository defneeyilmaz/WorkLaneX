using MediatR;
using WorkLaneX.Application.Common.Models;

namespace WorkLaneX.Application.Features.Workspaces.Queries.ListWorkspaceMembers;

public record ListWorkspaceMembersQuery(Guid WorkspaceId)
    : IRequest<OperationResult<IReadOnlyList<WorkspaceMemberSummary>>>;

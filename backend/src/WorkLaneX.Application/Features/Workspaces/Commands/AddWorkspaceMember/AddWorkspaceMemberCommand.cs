using MediatR;
using WorkLaneX.Application.Common.Models;
using WorkLaneX.Domain.Enums;

namespace WorkLaneX.Application.Features.Workspaces.Commands.AddWorkspaceMember;

public record AddWorkspaceMemberCommand(
    Guid WorkspaceId,
    string Email,
    WorkspaceRole Role) : IRequest<OperationResult<WorkspaceMemberSummary>>;

using WorkLaneX.Domain.Enums;

namespace WorkLaneX.Application.Common.Models;

public record WorkspaceMemberSummary(
    Guid UserId,
    string Email,
    string FullName,
    WorkspaceRole Role,
    DateTime JoinedAt);

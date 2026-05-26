using WorkLaneX.Domain.Enums;

namespace WorkLaneX.Application.Common.Models;

public record WorkspaceSummary(
    Guid Id,
    string Name,
    string? Description,
    WorkspaceRole Role,
    DateTime CreatedAt);

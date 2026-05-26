namespace WorkLaneX.Application.Common.Models;

public record ProjectSummary(
    Guid Id,
    Guid WorkspaceId,
    string Name,
    string? Description,
    DateTime CreatedAt);

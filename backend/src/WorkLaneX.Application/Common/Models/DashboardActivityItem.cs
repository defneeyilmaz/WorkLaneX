namespace WorkLaneX.Application.Common.Models;

public record DashboardActivityItem(
    Guid Id,
    Guid TaskId,
    string TaskTitle,
    string ProjectName,
    string ActorName,
    string Message,
    DateTime CreatedAt);

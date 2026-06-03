using WorkLaneX.Domain.Enums;

namespace WorkLaneX.Application.Common.Models;

public record ActivityLogSummary(
    Guid Id,
    Guid TaskId,
    ActivityActionType Action,
    string? Detail,
    Guid ActorId,
    string ActorName,
    string Message,
    DateTime CreatedAt);

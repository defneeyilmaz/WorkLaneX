using WorkLaneX.Domain.Enums;
using TaskStatusEnum = WorkLaneX.Domain.Enums.TaskStatus;

namespace WorkLaneX.Application.Common.Models;

public record TaskSummary(
    Guid Id,
    Guid ProjectId,
    string Title,
    string? Description,
    TaskStatusEnum Status,
    TaskPriority Priority,
    DateTime CreatedAt);

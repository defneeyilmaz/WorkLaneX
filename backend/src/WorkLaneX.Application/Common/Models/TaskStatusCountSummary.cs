using TaskStatusEnum = WorkLaneX.Domain.Enums.TaskStatus;

namespace WorkLaneX.Application.Common.Models;

public record TaskStatusCountSummary(TaskStatusEnum Status, int Count);

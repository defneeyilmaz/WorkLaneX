using WorkLaneX.Domain.Enums;
using TaskStatusEnum = WorkLaneX.Domain.Enums.TaskStatus;

namespace WorkLaneX.Application.Common.Models;

public record DashboardTaskSummary(
    Guid Id,
    Guid ProjectId,
    string ProjectName,
    string Title,
    TaskStatusEnum Status,
    TaskPriority Priority,
    TaskApprovalStatus ApprovalStatus);

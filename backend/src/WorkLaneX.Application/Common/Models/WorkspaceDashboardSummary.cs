namespace WorkLaneX.Application.Common.Models;

public record WorkspaceDashboardSummary(
    int TotalOpenTasks,
    int PendingApprovalCount,
    IReadOnlyList<DashboardTaskSummary> MyTasks,
    IReadOnlyList<DashboardTaskSummary> PendingApprovalTasks,
    IReadOnlyList<TaskStatusCountSummary> TasksByStatus,
    IReadOnlyList<DashboardProjectSummary> Projects,
    IReadOnlyList<DashboardActivityItem> RecentActivity);

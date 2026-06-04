using MediatR;
using Microsoft.EntityFrameworkCore;
using WorkLaneX.Application.Common.Interfaces;
using WorkLaneX.Application.Common.Mapping;
using WorkLaneX.Application.Common.Models;
using WorkLaneX.Domain.Entities;
using WorkLaneX.Domain.Enums;
using TaskStatusEnum = WorkLaneX.Domain.Enums.TaskStatus;

namespace WorkLaneX.Application.Features.Dashboard.Queries.GetWorkspaceDashboard;

public class GetWorkspaceDashboardQueryHandler
    : IRequestHandler<GetWorkspaceDashboardQuery, OperationResult<WorkspaceDashboardSummary>>
{
    private static readonly TaskStatusEnum[] AllStatuses =
    [
        TaskStatusEnum.ToDo,
        TaskStatusEnum.InProgress,
        TaskStatusEnum.Review,
        TaskStatusEnum.Done,
    ];

    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IWorkspaceAuthorizationService _authorization;
    private readonly IUserDirectory _userDirectory;

    public GetWorkspaceDashboardQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser,
        IWorkspaceAuthorizationService authorization,
        IUserDirectory userDirectory)
    {
        _context = context;
        _currentUser = currentUser;
        _authorization = authorization;
        _userDirectory = userDirectory;
    }

    public async Task<OperationResult<WorkspaceDashboardSummary>> Handle(
        GetWorkspaceDashboardQuery request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        if (userId is null)
        {
            return OperationResult<WorkspaceDashboardSummary>.Failure(
                "You must be signed in.");
        }

        var membership = await _authorization.GetMembershipAsync(
            request.WorkspaceId,
            userId.Value,
            cancellationToken);

        if (membership is null)
        {
            return OperationResult<WorkspaceDashboardSummary>.Failure(
                "Workspace not found or you do not have access.");
        }

        var projects = await _context.Projects
            .AsNoTracking()
            .Where(p => p.WorkspaceId == request.WorkspaceId)
            .OrderBy(p => p.Name)
            .Select(p => new { p.Id, p.Name })
            .ToListAsync(cancellationToken);

        var projectIds = projects.Select(p => p.Id).ToList();
        var projectNames = projects.ToDictionary(p => p.Id, p => p.Name);

        if (projectIds.Count == 0)
        {
            return OperationResult<WorkspaceDashboardSummary>.Success(
                new WorkspaceDashboardSummary(
                    0,
                    0,
                    [],
                    [],
                    AllStatuses.Select(s => new TaskStatusCountSummary(s, 0)).ToList(),
                    [],
                    []));
        }

        var tasksQuery = _context.TaskItems
            .AsNoTracking()
            .Where(t => projectIds.Contains(t.ProjectId));

        var totalOpenTasks = await tasksQuery
            .CountAsync(t => t.Status != TaskStatusEnum.Done, cancellationToken);

        var myTaskEntities = await tasksQuery
            .Where(t => t.AssigneeId == userId.Value && t.Status != TaskStatusEnum.Done)
            .OrderBy(t => t.Status)
            .ThenBy(t => t.SortOrder)
            .ThenBy(t => t.CreatedAt)
            .Take(10)
            .ToListAsync(cancellationToken);

        var canApprove = _authorization.CanApproveTasks(membership.Role);
        var pendingApprovalCount = 0;
        List<TaskItem> pendingTaskEntities = [];

        if (canApprove)
        {
            pendingApprovalCount = await tasksQuery
                .CountAsync(t => t.ApprovalStatus == TaskApprovalStatus.Pending, cancellationToken);

            pendingTaskEntities = await tasksQuery
                .Where(t => t.ApprovalStatus == TaskApprovalStatus.Pending)
                .OrderByDescending(t => t.UpdatedAt ?? t.CreatedAt)
                .Take(5)
                .ToListAsync(cancellationToken);
        }

        var statusCountsRaw = await tasksQuery
            .GroupBy(t => t.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var statusCountMap = statusCountsRaw.ToDictionary(x => x.Status, x => x.Count);
        var tasksByStatus = AllStatuses
            .Select(status => new TaskStatusCountSummary(
                status,
                statusCountMap.GetValueOrDefault(status, 0)))
            .ToList();

        var openCountsByProject = await tasksQuery
            .Where(t => t.Status != TaskStatusEnum.Done)
            .GroupBy(t => t.ProjectId)
            .Select(g => new { ProjectId = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var openCountMap = openCountsByProject.ToDictionary(x => x.ProjectId, x => x.Count);
        var projectSummaries = projects
            .Select(p => new DashboardProjectSummary(
                p.Id,
                p.Name,
                openCountMap.GetValueOrDefault(p.Id, 0)))
            .ToList();

        var logs = await _context.ActivityLogs
            .AsNoTracking()
            .Where(a => a.WorkspaceId == request.WorkspaceId)
            .OrderByDescending(a => a.CreatedAt)
            .Take(15)
            .ToListAsync(cancellationToken);

        var recentActivity = await MapActivityAsync(
            logs,
            projectNames,
            cancellationToken);

        var summary = new WorkspaceDashboardSummary(
            totalOpenTasks,
            pendingApprovalCount,
            MapTasks(myTaskEntities, projectNames),
            MapTasks(pendingTaskEntities, projectNames),
            tasksByStatus,
            projectSummaries,
            recentActivity);

        return OperationResult<WorkspaceDashboardSummary>.Success(summary);
    }

    private static IReadOnlyList<DashboardTaskSummary> MapTasks(
        IEnumerable<TaskItem> tasks,
        IReadOnlyDictionary<Guid, string> projectNames) =>
        tasks
            .Select(t => new DashboardTaskSummary(
                t.Id,
                t.ProjectId,
                projectNames.GetValueOrDefault(t.ProjectId, "Unknown"),
                t.Title,
                t.Status,
                t.Priority,
                t.ApprovalStatus))
            .ToList();

    private async Task<IReadOnlyList<DashboardActivityItem>> MapActivityAsync(
        List<ActivityLog> logs,
        IReadOnlyDictionary<Guid, string> projectNames,
        CancellationToken cancellationToken)
    {
        if (logs.Count == 0)
        {
            return [];
        }

        var taskIds = logs.Select(l => l.TaskId).Distinct().ToList();
        var taskMeta = await _context.TaskItems
            .AsNoTracking()
            .Where(t => taskIds.Contains(t.Id))
            .Select(t => new { t.Id, t.Title, t.ProjectId })
            .ToListAsync(cancellationToken);

        var taskTitles = taskMeta.ToDictionary(t => t.Id, t => t.Title);

        var actorIds = logs.Select(l => l.ActorId).Distinct();
        var actorNames = await _userDirectory.GetFullNamesAsync(actorIds, cancellationToken);

        return logs
            .Select(l =>
            {
                var title = taskTitles.GetValueOrDefault(l.TaskId, "Task");
                var projectName = projectNames.GetValueOrDefault(l.ProjectId, "Unknown");
                return new DashboardActivityItem(
                    l.Id,
                    l.TaskId,
                    title,
                    projectName,
                    actorNames.GetValueOrDefault(l.ActorId, "Unknown"),
                    ActivityLogFormatter.Format(l.Action, l.Detail),
                    l.CreatedAt);
            })
            .ToList();
    }
}

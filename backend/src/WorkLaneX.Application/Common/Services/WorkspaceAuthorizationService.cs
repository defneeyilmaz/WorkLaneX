using Microsoft.EntityFrameworkCore;
using WorkLaneX.Application.Common.Interfaces;
using WorkLaneX.Domain.Entities;
using WorkLaneX.Domain.Enums;
using TaskStatusEnum = WorkLaneX.Domain.Enums.TaskStatus;

namespace WorkLaneX.Application.Common.Services;

public class WorkspaceAuthorizationService : IWorkspaceAuthorizationService
{
    private static readonly TaskStatusEnum[] StatusOrder =
    [
        TaskStatusEnum.ToDo,
        TaskStatusEnum.InProgress,
        TaskStatusEnum.Review,
        TaskStatusEnum.Done,
    ];

    private readonly IApplicationDbContext _context;

    public WorkspaceAuthorizationService(IApplicationDbContext context)
    {
        _context = context;
    }

    public Task<WorkspaceMember?> GetMembershipAsync(
        Guid workspaceId,
        Guid userId,
        CancellationToken cancellationToken = default) =>
        _context.WorkspaceMembers
            .FirstOrDefaultAsync(
                m => m.WorkspaceId == workspaceId && m.UserId == userId,
                cancellationToken);

    public bool CanManageProjects(WorkspaceRole role) =>
        role is WorkspaceRole.Owner or WorkspaceRole.Admin;

    public bool CanManageTasks(WorkspaceRole role) =>
        role is WorkspaceRole.Owner or WorkspaceRole.Admin;

    public bool CanAssignTasks(WorkspaceRole role) =>
        role is WorkspaceRole.Owner or WorkspaceRole.Admin;

    public bool CanInviteMembers(WorkspaceRole role) =>
        role is WorkspaceRole.Owner or WorkspaceRole.Admin;

    public bool CanApproveTasks(WorkspaceRole role) =>
        role is WorkspaceRole.Owner or WorkspaceRole.Admin;

    public bool CanAssignRole(WorkspaceRole actorRole, WorkspaceRole targetRole)
    {
        if (actorRole == WorkspaceRole.Owner)
        {
            return true;
        }

        if (actorRole == WorkspaceRole.Admin)
        {
            return targetRole == WorkspaceRole.Member;
        }

        return false;
    }

    public bool CanMemberModifyTask(TaskItem task, Guid userId) =>
        task.AssigneeId == userId;

    public bool IsForwardStatusTransition(TaskStatusEnum from, TaskStatusEnum to)
    {
        var fromIndex = Array.IndexOf(StatusOrder, from);
        var toIndex = Array.IndexOf(StatusOrder, to);
        return fromIndex >= 0 && toIndex > fromIndex;
    }
}

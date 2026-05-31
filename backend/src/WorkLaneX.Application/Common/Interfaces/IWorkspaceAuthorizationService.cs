using WorkLaneX.Domain.Entities;
using WorkLaneX.Domain.Enums;
using TaskStatusEnum = WorkLaneX.Domain.Enums.TaskStatus;

namespace WorkLaneX.Application.Common.Interfaces;

public interface IWorkspaceAuthorizationService
{
    Task<WorkspaceMember?> GetMembershipAsync(
        Guid workspaceId,
        Guid userId,
        CancellationToken cancellationToken = default);

    bool CanManageProjects(WorkspaceRole role);

    bool CanManageTasks(WorkspaceRole role);

    bool CanAssignTasks(WorkspaceRole role);

    bool CanInviteMembers(WorkspaceRole role);

    bool CanApproveTasks(WorkspaceRole role);

    bool CanAssignRole(WorkspaceRole actorRole, WorkspaceRole targetRole);

    bool CanMemberModifyTask(TaskItem task, Guid userId);

    bool IsForwardStatusTransition(TaskStatusEnum from, TaskStatusEnum to);
}

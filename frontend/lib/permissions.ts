import type { TaskStatus, TaskSummary } from "@/lib/tasks";
import type { WorkspaceRole } from "@/lib/workspaces";

const STATUS_ORDER: TaskStatus[] = ["ToDo", "InProgress", "Review", "Done"];

export function normalizeWorkspaceRole(
  role: WorkspaceRole | number | string | undefined,
): WorkspaceRole {
  if (typeof role === "string") {
    if (role === "Viewer") {
      return "Member";
    }
    if (role === "Owner" || role === "Admin" || role === "Member") {
      return role;
    }
    return "Member";
  }
  const labels: WorkspaceRole[] = ["Owner", "Admin", "Member"];
  return labels[role ?? 2] ?? "Member";
}

export function isManagerRole(role: WorkspaceRole): boolean {
  return role === "Owner" || role === "Admin";
}

export function canCreateWorkspace(role: WorkspaceRole | null): boolean {
  return true;
}

export function canCreateProject(role: WorkspaceRole): boolean {
  return isManagerRole(role);
}

export function canCreateTask(role: WorkspaceRole): boolean {
  return isManagerRole(role);
}

export function canManageMembers(role: WorkspaceRole): boolean {
  return isManagerRole(role);
}

export function canApproveTasks(role: WorkspaceRole): boolean {
  return isManagerRole(role);
}

export function canInteractWithTask(
  role: WorkspaceRole,
  task: TaskSummary,
  userId: string,
): boolean {
  if (isManagerRole(role)) {
    return true;
  }
  return task.assigneeId === userId;
}

export function isForwardStatusTransition(from: TaskStatus, to: TaskStatus): boolean {
  return STATUS_ORDER.indexOf(to) > STATUS_ORDER.indexOf(from);
}

export function memberAllowedStatuses(
  current: TaskStatus,
  role: WorkspaceRole,
): TaskStatus[] {
  if (isManagerRole(role)) {
    return STATUS_ORDER;
  }
  return STATUS_ORDER.filter((status) => isForwardStatusTransition(current, status));
}

import axios from "axios";

import { api } from "@/lib/api";
import type { TaskApprovalStatus, TaskPriority, TaskStatus } from "@/lib/tasks";

export type DashboardTaskSummary = {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  approvalStatus: TaskApprovalStatus;
};

export type TaskStatusCountSummary = {
  status: TaskStatus;
  count: number;
};

export type DashboardProjectSummary = {
  id: string;
  name: string;
  openTaskCount: number;
};

export type DashboardActivityItem = {
  id: string;
  taskId: string;
  taskTitle: string;
  projectName: string;
  actorName: string;
  message: string;
  createdAt: string;
};

export type WorkspaceDashboardSummary = {
  totalOpenTasks: number;
  pendingApprovalCount: number;
  myTasks: DashboardTaskSummary[];
  pendingApprovalTasks: DashboardTaskSummary[];
  tasksByStatus: TaskStatusCountSummary[];
  projects: DashboardProjectSummary[];
  recentActivity: DashboardActivityItem[];
};

export async function fetchWorkspaceDashboard(
  workspaceId: string,
): Promise<WorkspaceDashboardSummary> {
  const { data } = await api.get<WorkspaceDashboardSummary>(
    `/api/workspaces/${workspaceId}/dashboard`,
  );
  return data;
}

export function getDashboardErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ error?: string }>(error)) {
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
  }
  return "Could not load dashboard.";
}

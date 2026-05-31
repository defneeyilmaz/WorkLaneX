import axios from "axios";

import { api } from "@/lib/api";

export type TaskStatus = "ToDo" | "InProgress" | "Review" | "Done";
export type TaskPriority = "Low" | "Medium" | "High" | "Urgent";
export type TaskApprovalStatus = "None" | "Pending" | "Approved" | "Rejected";

export type TaskSummary = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
  assigneeId: string | null;
  assigneeName: string | null;
  approvalStatus: TaskApprovalStatus;
  completionNote: string | null;
  rejectionNote: string | null;
};

export async function fetchProjectTasks(projectId: string): Promise<TaskSummary[]> {
  const { data } = await api.get<TaskSummary[]>(`/api/projects/${projectId}/tasks`);
  return data;
}

export async function createTask(
  projectId: string,
  title: string,
  description: string,
  priority: TaskPriority,
  assigneeId?: string | null,
): Promise<TaskSummary> {
  const { data } = await api.post<TaskSummary>(`/api/projects/${projectId}/tasks`, {
    title,
    description: description.trim() || null,
    priority,
    assigneeId: assigneeId ?? null,
  });
  return data;
}

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
  completionNote?: string,
): Promise<TaskSummary> {
  const { data } = await api.patch<TaskSummary>(`/api/projects/tasks/${taskId}/status`, {
    status,
    completionNote: completionNote?.trim() || null,
  });
  return data;
}

export type UpdateTaskInput = {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigneeId?: string | null;
  completionNote?: string;
};

export async function updateTask(
  taskId: string,
  input: UpdateTaskInput,
): Promise<TaskSummary> {
  const { data } = await api.patch<TaskSummary>(`/api/projects/tasks/${taskId}`, {
    title: input.title.trim(),
    description: input.description.trim() || null,
    priority: input.priority,
    status: input.status,
    assigneeId: input.assigneeId ?? null,
    completionNote: input.completionNote?.trim() || null,
  });
  return data;
}

export async function approveTask(taskId: string): Promise<TaskSummary> {
  const { data } = await api.post<TaskSummary>(`/api/projects/tasks/${taskId}/approve`);
  return data;
}

export async function rejectTask(
  taskId: string,
  rejectionNote: string,
): Promise<TaskSummary> {
  const { data } = await api.post<TaskSummary>(`/api/projects/tasks/${taskId}/reject`, {
    rejectionNote,
  });
  return data;
}

export function getTaskErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ error?: string; errors?: string[] }>(error)) {
    const data = error.response?.data;
    if (data?.errors?.length) {
      return data.errors.join(" ");
    }
    if (data?.error) {
      return data.error;
    }
  }
  return "Could not save task. Please try again.";
}

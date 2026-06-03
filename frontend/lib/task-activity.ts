import { api } from "@/lib/api";

export type ActivityActionType =
  | "TaskCreated"
  | "TaskStatusChanged"
  | "TaskUpdated"
  | "TaskCommentAdded"
  | "TaskApproved"
  | "TaskRejected";

export type ActivityLogSummary = {
  id: string;
  taskId: string;
  action: ActivityActionType;
  detail: string | null;
  actorId: string;
  actorName: string;
  message: string;
  createdAt: string;
};

export async function fetchTaskActivity(taskId: string): Promise<ActivityLogSummary[]> {
  const { data } = await api.get<ActivityLogSummary[]>(
    `/api/projects/tasks/${taskId}/activity`,
  );
  return data;
}

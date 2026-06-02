import axios from "axios";

import { api } from "@/lib/api";

export type TaskCommentSummary = {
  id: string;
  taskId: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: string;
};

export async function fetchTaskComments(taskId: string): Promise<TaskCommentSummary[]> {
  const { data } = await api.get<TaskCommentSummary[]>(
    `/api/projects/tasks/${taskId}/comments`,
  );
  return data;
}

export async function addTaskComment(
  taskId: string,
  body: string,
): Promise<TaskCommentSummary> {
  const { data } = await api.post<TaskCommentSummary>(
    `/api/projects/tasks/${taskId}/comments`,
    { body: body.trim() },
  );
  return data;
}

export function getTaskCommentErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ error?: string; errors?: string[] }>(error)) {
    const data = error.response?.data;
    if (data?.errors?.length) {
      return data.errors.join(" ");
    }
    if (data?.error) {
      return data.error;
    }
  }
  return "Could not save comment. Please try again.";
}

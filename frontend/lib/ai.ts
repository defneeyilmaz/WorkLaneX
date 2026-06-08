import axios from "axios";

import { api } from "@/lib/api";
import type { TaskPriority } from "@/lib/tasks";

export type SuggestedSubtaskSummary = {
  title: string;
  description: string | null;
  priority: TaskPriority;
};

export type TaskBreakdownResult = {
  taskId: string;
  taskTitle: string;
  usedMockProvider: boolean;
  subtasks: SuggestedSubtaskSummary[];
};

export async function breakDownTask(taskId: string): Promise<TaskBreakdownResult> {
  const { data } = await api.post<TaskBreakdownResult>(
    `/api/ai/tasks/${taskId}/breakdown`,
  );
  return data;
}

export function getAiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ error?: string }>(error)) {
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
  }
  return "Could not generate subtasks.";
}

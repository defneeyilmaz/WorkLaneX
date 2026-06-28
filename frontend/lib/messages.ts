import axios from "axios";

import { api } from "@/lib/api";

export type ProjectMessageSummary = {
  id: string;
  projectId: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: string;
};

export async function fetchProjectMessages(
  projectId: string,
): Promise<ProjectMessageSummary[]> {
  const { data } = await api.get<ProjectMessageSummary[]>(
    `/api/projects/${projectId}/messages`,
  );
  return data;
}

export async function createProjectMessage(
  projectId: string,
  body: string,
): Promise<ProjectMessageSummary> {
  const { data } = await api.post<ProjectMessageSummary>(
    `/api/projects/${projectId}/messages`,
    { body },
  );
  return data;
}

export function getMessageErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ error?: string; errors?: string[] }>(error)) {
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    const errors = error.response?.data?.errors;
    if (errors?.length) {
      return errors.join(" ");
    }
  }
  return "Could not send message.";
}

export function formatMessageTime(value: string): string {
  return new Date(value).toLocaleString();
}

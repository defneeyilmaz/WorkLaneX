import axios from "axios";

import { api } from "@/lib/api";

export type ProjectSummary = {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  createdAt: string;
};

export async function fetchWorkspaceProjects(
  workspaceId: string,
): Promise<ProjectSummary[]> {
  const { data } = await api.get<ProjectSummary[]>(
    `/api/workspaces/${workspaceId}/projects`,
  );
  return data;
}

export async function createProject(
  workspaceId: string,
  name: string,
  description?: string,
): Promise<ProjectSummary> {
  const { data } = await api.post<ProjectSummary>(
    `/api/workspaces/${workspaceId}/projects`,
    {
      name,
      description: description?.trim() || null,
    },
  );
  return data;
}

export function getProjectErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ error?: string; errors?: string[] }>(error)) {
    const data = error.response?.data;
    if (data?.errors?.length) {
      return data.errors.join(" ");
    }
    if (data?.error) {
      return data.error;
    }
  }
  return "Could not save project. Please try again.";
}

import axios from "axios";

import { api } from "@/lib/api";

export type WorkspaceRole = "Owner" | "Admin" | "Member" | "Viewer";

export type WorkspaceSummary = {
  id: string;
  name: string;
  description: string | null;
  role: WorkspaceRole | number;
  createdAt: string;
};

export function formatWorkspaceRole(role: WorkspaceSummary["role"]): string {
  if (typeof role === "string") {
    return role;
  }
  const labels = ["Owner", "Admin", "Member", "Viewer"];
  return labels[role] ?? "Member";
}

export async function fetchMyWorkspaces(): Promise<WorkspaceSummary[]> {
  const { data } = await api.get<WorkspaceSummary[]>("/api/workspaces");
  return data;
}

export async function createWorkspace(
  name: string,
  description?: string,
): Promise<WorkspaceSummary> {
  const { data } = await api.post<WorkspaceSummary>("/api/workspaces", {
    name,
    description: description?.trim() || null,
  });
  return data;
}

export function getWorkspaceErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ error?: string; errors?: string[] }>(error)) {
    const data = error.response?.data;
    if (data?.errors?.length) {
      return data.errors.join(" ");
    }
    if (data?.error) {
      return data.error;
    }
  }
  return "Could not save workspace. Please try again.";
}

import axios from "axios";

import { api } from "@/lib/api";

export type ProjectDocumentSummary = {
  id: string;
  projectId: string;
  title: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string | null;
};

export type ProjectDocumentDetail = ProjectDocumentSummary & {
  content: string;
};

export async function fetchProjectDocuments(
  projectId: string,
): Promise<ProjectDocumentSummary[]> {
  const { data } = await api.get<ProjectDocumentSummary[]>(
    `/api/projects/${projectId}/documents`,
  );
  return data;
}

export async function fetchProjectDocument(
  documentId: string,
): Promise<ProjectDocumentDetail> {
  const { data } = await api.get<ProjectDocumentDetail>(
    `/api/projects/documents/${documentId}`,
  );
  return data;
}

export async function createProjectDocument(
  projectId: string,
  title: string,
  content?: string,
): Promise<ProjectDocumentDetail> {
  const { data } = await api.post<ProjectDocumentDetail>(
    `/api/projects/${projectId}/documents`,
    {
      title,
      content: content?.trim() || null,
    },
  );
  return data;
}

export async function updateProjectDocument(
  documentId: string,
  payload: { title?: string; content?: string },
): Promise<ProjectDocumentDetail> {
  const { data } = await api.patch<ProjectDocumentDetail>(
    `/api/projects/documents/${documentId}`,
    payload,
  );
  return data;
}

export async function deleteProjectDocument(documentId: string): Promise<void> {
  await api.delete(`/api/projects/documents/${documentId}`);
}

export function getDocumentErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ error?: string; errors?: string[] }>(error)) {
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    const errors = error.response?.data?.errors;
    if (errors?.length) {
      return errors.join(" ");
    }
  }
  return "Could not save document.";
}

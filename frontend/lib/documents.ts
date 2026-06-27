import axios from "axios";

import { api } from "@/lib/api";

export type DocumentType = "Spec" | "MeetingNote";

export type ProjectDocumentSummary = {
  id: string;
  projectId: string;
  title: string;
  type: DocumentType;
  meetingHeldAt: string | null;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string | null;
};

export type ProjectDocumentDetail = ProjectDocumentSummary & {
  content: string;
};

export function buildMeetingNoteTemplate(date = new Date()) {
  const meetingDate = date.toISOString().slice(0, 10);
  return {
    title: `Sprint planning — ${meetingDate}`,
    meetingHeldAt: meetingDate,
    content: `# Sprint planning — ${meetingDate}

**Attendees:** 

**Agenda**
- 

**Notes**
- 

**Action items**
- [ ] `,
  };
}

export async function fetchProjectDocuments(
  projectId: string,
  type?: DocumentType,
): Promise<ProjectDocumentSummary[]> {
  const { data } = await api.get<ProjectDocumentSummary[]>(
    `/api/projects/${projectId}/documents`,
    {
      params: type ? { type } : undefined,
    },
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
  payload: {
    title: string;
    content?: string;
    type?: DocumentType;
    meetingHeldAt?: string | null;
  },
): Promise<ProjectDocumentDetail> {
  const { data } = await api.post<ProjectDocumentDetail>(
    `/api/projects/${projectId}/documents`,
    {
      title: payload.title,
      content: payload.content?.trim() || null,
      type: payload.type,
      meetingHeldAt: payload.meetingHeldAt ?? null,
    },
  );
  return data;
}

export async function updateProjectDocument(
  documentId: string,
  payload: {
    title?: string;
    content?: string;
    meetingHeldAt?: string | null;
  },
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

export function formatDocumentDate(value: string | null): string {
  if (!value) {
    return "";
  }
  return new Date(value).toLocaleString();
}

export function formatMeetingDate(value: string | null): string {
  if (!value) {
    return "";
  }
  return new Date(value).toLocaleDateString();
}

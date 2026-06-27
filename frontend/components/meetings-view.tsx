"use client";

import { ProjectDocumentsView } from "@/components/project-documents-view";
import type { WorkspaceRole } from "@/lib/workspaces";

type MeetingsViewProps = {
  projectId: string;
  projectName: string;
  workspaceRole: WorkspaceRole;
  userId: string;
};

export function MeetingsView(props: MeetingsViewProps) {
  return (
    <ProjectDocumentsView
      {...props}
      documentType="MeetingNote"
      listLabel="Meeting notes for"
      emptyTitle="No meeting notes yet"
      emptyDescription="Capture standups, planning sessions, and decisions with a structured template."
      newButtonLabel="New meeting note"
      contentPlaceholder={"# Meeting title\n\n**Attendees:**\n\n**Notes**\n- "}
    />
  );
}

"use client";

import { ProjectDocumentsView } from "@/components/project-documents-view";
import type { WorkspaceRole } from "@/lib/workspaces";

type DocsViewProps = {
  projectId: string;
  projectName: string;
  workspaceRole: WorkspaceRole;
  userId: string;
};

export function DocsView(props: DocsViewProps) {
  return (
    <ProjectDocumentsView
      {...props}
      documentType="Spec"
      listLabel="Project docs for"
      emptyTitle="No documents yet"
      emptyDescription="Create a markdown doc for specs, notes, or release info."
      newButtonLabel="New document"
      contentPlaceholder={"# Spec\n\n- Bullet\n- **Bold** text"}
    />
  );
}

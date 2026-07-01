"use client";

import { useCallback, useState } from "react";
import { ArrowLeft, FileText, Plus, Trash2 } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { LoadingState } from "@/components/loading-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarkdownPreview } from "@/components/markdown-preview";
import {
  buildMeetingNoteTemplate,
  createProjectDocument,
  deleteProjectDocument,
  fetchProjectDocument,
  fetchProjectDocuments,
  formatDocumentDate,
  formatMeetingDate,
  getDocumentErrorMessage,
  updateProjectDocument,
  type DocumentType,
  type ProjectDocumentDetail,
  type ProjectDocumentSummary,
} from "@/lib/documents";
import { isManagerRole } from "@/lib/permissions";
import type { WorkspaceRole } from "@/lib/workspaces";
import { cn } from "@/lib/utils";
import { useDeferredEffect } from "@/lib/use-deferred-effect";

type EditorPane = "write" | "preview";

type ProjectDocumentsViewProps = {
  projectId: string;
  projectName: string;
  workspaceRole: WorkspaceRole;
  userId: string;
  documentType: DocumentType;
  listLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  newButtonLabel: string;
  contentPlaceholder: string;
};

export function ProjectDocumentsView({
  projectId,
  projectName,
  workspaceRole,
  userId,
  documentType,
  listLabel,
  emptyTitle,
  emptyDescription,
  newButtonLabel,
  contentPlaceholder,
}: ProjectDocumentsViewProps) {
  const [documents, setDocuments] = useState<ProjectDocumentSummary[]>([]);
  const [activeDocument, setActiveDocument] = useState<ProjectDocumentDetail | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [meetingHeldAt, setMeetingHeldAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editorPane, setEditorPane] = useState<EditorPane>("write");

  const isEditing = isNew || activeDocument !== null;
  const showMeetingDate = documentType === "MeetingNote";

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchProjectDocuments(projectId, documentType);
      setDocuments(data);
    } catch (err) {
      setDocuments([]);
      setError(getDocumentErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [documentType, projectId]);

  useDeferredEffect(() => {
    setActiveDocument(null);
    setIsNew(false);
    setTitle("");
    setContent("");
    setMeetingHeldAt("");
    return loadDocuments();
  }, [loadDocuments, projectId]);

  const openNewDocument = () => {
    setActiveDocument(null);
    setIsNew(true);
    setError(null);
    setEditorPane("write");

    if (documentType === "MeetingNote") {
      const template = buildMeetingNoteTemplate();
      setTitle(template.title);
      setContent(template.content);
      setMeetingHeldAt(template.meetingHeldAt);
      return;
    }

    setTitle("");
    setContent("");
    setMeetingHeldAt("");
  };

  const openDocument = async (documentId: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const doc = await fetchProjectDocument(documentId);
      setActiveDocument(doc);
      setIsNew(false);
      setTitle(doc.title);
      setContent(doc.content);
      setMeetingHeldAt(doc.meetingHeldAt?.slice(0, 10) ?? "");
      setEditorPane("preview");
    } catch (err) {
      setError(getDocumentErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const backToList = () => {
    setActiveDocument(null);
    setIsNew(false);
    setTitle("");
    setContent("");
    setMeetingHeldAt("");
    setEditorPane("write");
    setError(null);
    void loadDocuments();
  };

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Title is required.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const meetingDateValue =
        showMeetingDate && meetingHeldAt.trim()
          ? new Date(`${meetingHeldAt.trim()}T12:00:00`).toISOString()
          : null;

      if (isNew) {
        const created = await createProjectDocument(projectId, {
          title: trimmedTitle,
          content,
          type: documentType,
          meetingHeldAt: meetingDateValue,
        });
        setActiveDocument(created);
        setIsNew(false);
      } else if (activeDocument) {
        const updated = await updateProjectDocument(activeDocument.id, {
          title: trimmedTitle,
          content,
          meetingHeldAt: meetingDateValue,
        });
        setActiveDocument(updated);
        setTitle(updated.title);
        setContent(updated.content);
        setMeetingHeldAt(updated.meetingHeldAt?.slice(0, 10) ?? "");
      }
      await loadDocuments();
    } catch (err) {
      setError(getDocumentErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activeDocument) {
      return;
    }

    if (!window.confirm(`Delete "${activeDocument.title}"?`)) {
      return;
    }

    setIsDeleting(true);
    setError(null);
    try {
      await deleteProjectDocument(activeDocument.id);
      backToList();
    } catch (err) {
      setError(getDocumentErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const canDelete =
    activeDocument !== null &&
    (activeDocument.authorId === userId || isManagerRole(workspaceRole));

  if (isEditing) {
    return (
      <div className="docs-view space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="outline" onClick={backToList}>
            <ArrowLeft className="size-4" />
            Back to list
          </Button>
          <div className="flex flex-wrap gap-2">
            {canDelete ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() => void handleDelete()}
                disabled={isDeleting || isSaving}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            ) : null}
            <Button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving || isDeleting}
            >
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>

        {error ? (
          <p className="rounded-md bg-[#ffebe6] px-3 py-2 text-sm text-[#bf2600]" role="alert">
            {error}
          </p>
        ) : null}

        <section className="dashboard-panel space-y-4">
          {showMeetingDate ? (
            <div className="space-y-2">
              <Label htmlFor="meeting-date">Meeting date</Label>
              <Input
                id="meeting-date"
                type="date"
                value={meetingHeldAt}
                onChange={(e) => setMeetingHeldAt(e.target.value)}
              />
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="doc-title">Title</Label>
            <Input
              id="doc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title"
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor="doc-content">Content (Markdown)</Label>
              <div className="docs-editor-tabs" role="tablist" aria-label="Editor mode">
                <button
                  type="button"
                  role="tab"
                  aria-selected={editorPane === "write"}
                  className={cn(
                    "docs-editor-tab",
                    editorPane === "write" && "docs-editor-tab-active",
                  )}
                  onClick={() => setEditorPane("write")}
                >
                  Write
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={editorPane === "preview"}
                  className={cn(
                    "docs-editor-tab",
                    editorPane === "preview" && "docs-editor-tab-active",
                  )}
                  onClick={() => setEditorPane("preview")}
                >
                  Preview
                </button>
              </div>
            </div>
            {editorPane === "write" ? (
              <textarea
                id="doc-content"
                className="docs-editor-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={contentPlaceholder}
                rows={18}
              />
            ) : (
              <MarkdownPreview content={content} />
            )}
          </div>
          {activeDocument ? (
            <p className="text-xs text-[var(--wlx-muted)]">
              By {activeDocument.authorName} · Updated{" "}
              {formatDocumentDate(activeDocument.updatedAt ?? activeDocument.createdAt)}
            </p>
          ) : null}
        </section>
      </div>
    );
  }

  return (
    <div className="docs-view space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--wlx-muted)]">
          {listLabel}{" "}
          <span className="font-medium text-[var(--wlx-text)]">{projectName}</span>
        </p>
        <Button type="button" onClick={openNewDocument}>
          <Plus className="size-4" />
          {newButtonLabel}
        </Button>
      </div>

      {error ? (
        <p className="rounded-md bg-[#ffebe6] px-3 py-2 text-sm text-[#bf2600]" role="alert">
          {error}
        </p>
      ) : null}

      <section className="dashboard-panel">
        {isLoading ? (
          <LoadingState label="Loading documents…" />
        ) : documents.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={emptyTitle}
            description={emptyDescription}
            action={
              <Button type="button" onClick={openNewDocument}>
                <Plus className="size-4" />
                {newButtonLabel}
              </Button>
            }
          />
        ) : (
          <ul className="space-y-2">
            {documents.map((doc) => (
              <li key={doc.id}>
                <button
                  type="button"
                  onClick={() => void openDocument(doc.id)}
                  className="dashboard-task-row w-full border-l-[var(--wlx-brand)] text-left"
                >
                  <p className="font-medium text-[var(--wlx-text)]">{doc.title}</p>
                  <p className="mt-1 text-sm text-[var(--wlx-muted)]">
                    {doc.meetingHeldAt
                      ? `${formatMeetingDate(doc.meetingHeldAt)} · `
                      : ""}
                    {doc.authorName} · {formatDocumentDate(doc.updatedAt ?? doc.createdAt)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

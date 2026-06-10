"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, FileText, Plus, Trash2 } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { LoadingState } from "@/components/loading-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarkdownPreview } from "@/components/markdown-preview";
import {
  createProjectDocument,
  deleteProjectDocument,
  fetchProjectDocument,
  fetchProjectDocuments,
  getDocumentErrorMessage,
  updateProjectDocument,
  type ProjectDocumentDetail,
  type ProjectDocumentSummary,
} from "@/lib/documents";
import { isManagerRole } from "@/lib/permissions";
import type { WorkspaceRole } from "@/lib/workspaces";
import { cn } from "@/lib/utils";

type EditorPane = "write" | "preview";

type DocsViewProps = {
  projectId: string;
  projectName: string;
  workspaceRole: WorkspaceRole;
  userId: string;
};

function formatDocDate(value: string | null): string {
  if (!value) {
    return "";
  }
  return new Date(value).toLocaleString();
}

export function DocsView({
  projectId,
  projectName,
  workspaceRole,
  userId,
}: DocsViewProps) {
  const [documents, setDocuments] = useState<ProjectDocumentSummary[]>([]);
  const [activeDocument, setActiveDocument] = useState<ProjectDocumentDetail | null>(
    null,
  );
  const [isNew, setIsNew] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editorPane, setEditorPane] = useState<EditorPane>("write");

  const isEditing = isNew || activeDocument !== null;

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchProjectDocuments(projectId);
      setDocuments(data);
    } catch (err) {
      setDocuments([]);
      setError(getDocumentErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    setActiveDocument(null);
    setIsNew(false);
    setTitle("");
    setContent("");
    void loadDocuments();
  }, [loadDocuments, projectId]);

  const openNewDocument = () => {
    setActiveDocument(null);
    setIsNew(true);
    setTitle("");
    setContent("");
    setEditorPane("write");
    setError(null);
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
      if (isNew) {
        const created = await createProjectDocument(
          projectId,
          trimmedTitle,
          content,
        );
        setActiveDocument(created);
        setIsNew(false);
      } else if (activeDocument) {
        const updated = await updateProjectDocument(activeDocument.id, {
          title: trimmedTitle,
          content,
        });
        setActiveDocument(updated);
        setTitle(updated.title);
        setContent(updated.content);
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
                placeholder={"# Spec\n\n- Bullet\n- **Bold** text"}
                rows={18}
              />
            ) : (
              <MarkdownPreview content={content} />
            )}
          </div>
          {activeDocument ? (
            <p className="text-xs text-[#78716c]">
              By {activeDocument.authorName} · Updated{" "}
              {formatDocDate(activeDocument.updatedAt ?? activeDocument.createdAt)}
            </p>
          ) : null}
        </section>
      </div>
    );
  }

  return (
    <div className="docs-view space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#78716c]">
          Project docs for <span className="font-medium text-[#1c1917]">{projectName}</span>
        </p>
        <Button type="button" onClick={openNewDocument}>
          <Plus className="size-4" />
          New document
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
            title="No documents yet"
            description="Create a markdown doc for specs, notes, or release info."
            action={
              <Button type="button" onClick={openNewDocument}>
                <Plus className="size-4" />
                New document
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
                  className={cn(
                    "dashboard-task-row w-full border-l-[#ea580c] text-left",
                  )}
                >
                  <p className="font-medium text-[#1c1917]">{doc.title}</p>
                  <p className="mt-1 text-sm text-[#78716c]">
                    {doc.authorName} ·{" "}
                    {formatDocDate(doc.updatedAt ?? doc.createdAt)}
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

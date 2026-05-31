"use client";

import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createWorkspace,
  getWorkspaceErrorMessage,
  type WorkspaceSummary,
} from "@/lib/workspaces";

type CreateWorkspaceDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (workspace: WorkspaceSummary) => void;
};

export function CreateWorkspaceDialog({
  open,
  onClose,
  onCreated,
}: CreateWorkspaceDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    setName("");
    setDescription("");
    setError(null);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open || !mounted) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const created = await createWorkspace(name.trim(), description);
      onCreated(created);
      onClose();
    } catch (err) {
      setError(getWorkspaceErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return createPortal(
    <>
      <button
        type="button"
        className="task-create-backdrop"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        className="task-create-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-workspace-title"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="create-workspace-title" className="text-xl font-semibold text-[#1c1917]">
              New workspace
            </h2>
            <p className="mt-1 text-sm text-[#78716c]">
              Create a workspace for your team and projects.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[#78716c] hover:bg-[#f5f5f4] hover:text-[#1c1917]"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <p className="rounded-md bg-[#ffebe6] px-3 py-2 text-sm text-[#bf2600]" role="alert">
              {error}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="create-workspace-name">Name</Label>
            <Input
              id="create-workspace-name"
              className="h-10"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Product team"
              required
              maxLength={200}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-workspace-description">Description (optional)</Label>
            <Input
              id="create-workspace-description"
              className="h-10"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
              maxLength={1000}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="dialog-btn-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create workspace"}
            </Button>
          </div>
        </form>
      </div>
    </>,
    document.body,
  );
}

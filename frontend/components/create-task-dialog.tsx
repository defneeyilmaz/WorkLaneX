"use client";

import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createTask,
  getTaskErrorMessage,
  type TaskPriority,
  type TaskSummary,
} from "@/lib/tasks";
import type { WorkspaceMemberSummary } from "@/lib/workspaces";

type CreateTaskDialogProps = {
  open: boolean;
  projectId: string;
  projectName: string;
  members: WorkspaceMemberSummary[];
  onClose: () => void;
  onCreated: (task: TaskSummary) => void;
};

export function CreateTaskDialog({
  open,
  projectId,
  projectName,
  members,
  onClose,
  onCreated,
}: CreateTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("Medium");
  const [assigneeId, setAssigneeId] = useState("");
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
    setTitle("");
    setDescription("");
    setPriority("Medium");
    setAssigneeId("");
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
      const created = await createTask(
        projectId,
        title.trim(),
        description,
        priority,
        assigneeId || null,
      );
      onCreated(created);
      onClose();
    } catch (err) {
      setError(getTaskErrorMessage(err));
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
        aria-labelledby="create-task-title"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="create-task-title" className="text-xl font-semibold text-[#1c1917]">
              Create task
            </h2>
            <p className="mt-1 text-sm text-[#78716c]">Add a new task to {projectName}</p>
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
            <Label htmlFor="create-task-title">Title</Label>
            <Input
              id="create-task-title"
              className="h-10"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Design onboarding flow"
              required
              maxLength={200}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-task-description">Description (optional)</Label>
            <Input
              id="create-task-description"
              className="h-10"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail for this task"
              maxLength={2000}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="create-task-priority">Priority</Label>
              <select
                id="create-task-priority"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-task-assignee">Assignee</Label>
              <select
                id="create-task-assignee"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.fullName}
                  </option>
                ))}
              </select>
            </div>
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
              {isSubmitting ? "Creating…" : "Create task"}
            </Button>
          </div>
        </form>
      </div>
    </>,
    document.body,
  );
}

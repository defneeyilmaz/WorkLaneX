"use client";

import { FormEvent, useEffect, useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getTaskErrorMessage,
  type TaskPriority,
  type TaskStatus,
  type TaskSummary,
  updateTask,
} from "@/lib/tasks";
import { cn } from "@/lib/utils";

const STATUSES: TaskStatus[] = ["ToDo", "InProgress", "Review", "Done"];
const STATUS_LABELS: Record<TaskStatus, string> = {
  ToDo: "To Do",
  InProgress: "In Progress",
  Review: "Review",
  Done: "Done",
};

const PRIORITY_CLASSES: Record<TaskPriority, string> = {
  Low: "bg-slate-100 text-slate-700",
  Medium: "bg-sky-100 text-sky-800",
  High: "bg-amber-100 text-amber-900",
  Urgent: "bg-rose-100 text-rose-900",
};

type TaskDetailDrawerProps = {
  task: TaskSummary | null;
  open: boolean;
  onClose: () => void;
  onSaved: (task: TaskSummary) => void;
};

export function TaskDetailDrawer({
  task,
  open,
  onClose,
  onSaved,
}: TaskDetailDrawerProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("Medium");
  const [status, setStatus] = useState<TaskStatus>("ToDo");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!task) {
      return;
    }

    setTitle(task.title);
    setDescription(task.description ?? "");
    setPriority(task.priority);
    setStatus(task.status);
    setError(null);
  }, [task]);

  if (!open || !task) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const updated = await updateTask(task!.id, {
        title,
        description,
        priority,
        status,
      });
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(getTaskErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="task-detail-backdrop"
        onClick={onClose}
        aria-label="Close task details"
      />
      <aside
        className="task-detail-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-detail-title"
      >
        <div className="flex items-start justify-between border-b border-white/50 px-5 py-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Task details</p>
            <h2 id="task-detail-title" className="mt-1 text-xl font-semibold">
              {task.title}
            </h2>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  PRIORITY_CLASSES[task.priority],
                )}
              >
                {task.priority}
              </span>
              <span>Created {new Date(task.createdAt).toLocaleDateString()}</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="detail-title">Title</Label>
              <Input
                id="detail-title"
                className="h-11 text-base"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="detail-description">Description</Label>
              <textarea
                id="detail-description"
                className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more context for this task"
                maxLength={2000}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="detail-priority">Priority</Label>
                <select
                  id="detail-priority"
                  className="h-11 w-full rounded-md border border-input bg-background px-3 text-base"
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
                <Label htmlFor="detail-status">Status</Label>
                <select
                  id="detail-status"
                  className="h-11 w-full rounded-md border border-input bg-background px-3 text-base"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                >
                  {STATUSES.map((option) => (
                    <option key={option} value={option}>
                      {STATUS_LABELS[option]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-white/50 px-5 py-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </aside>
    </>
  );
}

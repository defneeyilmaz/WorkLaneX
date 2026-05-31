"use client";

import { FormEvent, useEffect, useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  canApproveTasks,
  canInteractWithTask,
  isManagerRole,
  memberAllowedStatuses,
  normalizeWorkspaceRole,
} from "@/lib/permissions";
import {
  approveTask,
  getTaskErrorMessage,
  rejectTask,
  type TaskPriority,
  type TaskStatus,
  type TaskSummary,
  updateTask,
} from "@/lib/tasks";
import type { WorkspaceMemberSummary, WorkspaceRole } from "@/lib/workspaces";
import { cn } from "@/lib/utils";

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
  workspaceRole: WorkspaceRole;
  userId: string;
  members: WorkspaceMemberSummary[];
  onClose: () => void;
  onSaved: (task: TaskSummary) => void;
};

export function TaskDetailDrawer({
  task,
  open,
  workspaceRole,
  userId,
  members,
  onClose,
  onSaved,
}: TaskDetailDrawerProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("Medium");
  const [status, setStatus] = useState<TaskStatus>("ToDo");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [completionNote, setCompletionNote] = useState("");
  const [rejectionNote, setRejectionNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const role = normalizeWorkspaceRole(workspaceRole);
  const isManager = isManagerRole(role);
  const canEdit =
    task !== null && (isManager || canInteractWithTask(role, task, userId));

  useEffect(() => {
    if (!task) {
      return;
    }

    setTitle(task.title);
    setDescription(task.description ?? "");
    setPriority(task.priority);
    setStatus(task.status);
    setAssigneeId(task.assigneeId ?? "");
    setCompletionNote(task.completionNote ?? "");
    setRejectionNote("");
    setError(null);
  }, [task]);

  if (!open || !task) {
    return null;
  }

  const allowedStatuses = memberAllowedStatuses(task.status, role);
  const showCompletionNote = !isManager && status === "Done";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEdit) {
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      const updated = await updateTask(task!.id, {
        title: isManager ? title : task!.title,
        description: isManager ? description : task!.description ?? "",
        priority: isManager ? priority : task!.priority,
        status,
        assigneeId: isManager ? assigneeId || null : task!.assigneeId,
        completionNote: showCompletionNote ? completionNote : undefined,
      });
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(getTaskErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleApprove() {
    setError(null);
    setIsApproving(true);
    try {
      const updated = await approveTask(task!.id);
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(getTaskErrorMessage(err));
    } finally {
      setIsApproving(false);
    }
  }

  async function handleReject() {
    if (!rejectionNote.trim()) {
      setError("Add a rejection note before sending the task back.");
      return;
    }

    setError(null);
    setIsApproving(true);
    try {
      const updated = await rejectTask(task!.id, rejectionNote.trim());
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(getTaskErrorMessage(err));
    } finally {
      setIsApproving(false);
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

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  PRIORITY_CLASSES[task.priority],
                )}
              >
                {task.priority}
              </span>
              {task.approvalStatus === "Pending" ? (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                  Awaiting approval
                </span>
              ) : null}
              {task.approvalStatus === "Approved" ? (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-900">
                  Approved
                </span>
              ) : null}
              {task.approvalStatus === "Rejected" ? (
                <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-900">
                  Sent back
                </span>
              ) : null}
            </div>

            {task.rejectionNote ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-900">
                <p className="font-semibold">Rejection note</p>
                <p className="mt-1">{task.rejectionNote}</p>
              </div>
            ) : null}

            {task.completionNote ? (
              <div className="rounded-xl border border-white/70 bg-white/70 px-4 py-3 text-sm">
                <p className="font-semibold text-muted-foreground">Completion note</p>
                <p className="mt-1">{task.completionNote}</p>
              </div>
            ) : null}

            {isManager ? (
              <>
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
                      {(["ToDo", "InProgress", "Review", "Done"] as TaskStatus[]).map(
                        (option) => (
                          <option key={option} value={option}>
                            {STATUS_LABELS[option]}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="detail-assignee">Assignee</Label>
                  <select
                    id="detail-assignee"
                    className="h-11 w-full rounded-md border border-input bg-background px-3 text-base"
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
              </>
            ) : canEdit ? (
              <>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <p className="text-base font-medium">{task.title}</p>
                </div>
                {task.description ? (
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  </div>
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor="detail-status-member">Status</Label>
                  <select
                    id="detail-status-member"
                    className="h-11 w-full rounded-md border border-input bg-background px-3 text-base"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  >
                    <option value={task.status}>{STATUS_LABELS[task.status]}</option>
                    {allowedStatuses.map((option) => (
                      <option key={option} value={option}>
                        {STATUS_LABELS[option]}
                      </option>
                    ))}
                  </select>
                </div>
                {showCompletionNote ? (
                  <div className="space-y-2">
                    <Label htmlFor="detail-completion-note">Completion note (optional)</Label>
                    <textarea
                      id="detail-completion-note"
                      className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      value={completionNote}
                      onChange={(e) => setCompletionNote(e.target.value)}
                      placeholder="Add context about what was completed"
                      maxLength={2000}
                    />
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                You can view this task but only edit tasks assigned to you.
              </p>
            )}

            {canApproveTasks(role) && task!.approvalStatus === "Pending" ? (
              <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/80 p-4">
                <p className="text-sm font-semibold text-amber-950">
                  This task is waiting for your approval.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="detail-rejection-note">Rejection note</Label>
                  <textarea
                    id="detail-rejection-note"
                    className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={rejectionNote}
                    onChange={(e) => setRejectionNote(e.target.value)}
                    placeholder="Required if you send the task back to To Do"
                    maxLength={2000}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    disabled={isApproving}
                    onClick={() => void handleApprove()}
                  >
                    Accept
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isApproving}
                    onClick={() => void handleReject()}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-white/50 px-5 py-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {canEdit ? (
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving…" : "Save changes"}
              </Button>
            ) : null}
          </div>
        </form>
      </aside>
    </>
  );
}

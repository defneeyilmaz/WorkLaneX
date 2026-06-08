"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  breakDownTask,
  getAiErrorMessage,
  type TaskBreakdownResult,
} from "@/lib/ai";
import {
  canApproveTasks,
  canInteractWithTask,
  isManagerRole,
  memberAllowedStatuses,
  normalizeWorkspaceRole,
} from "@/lib/permissions";
import {
  fetchTaskActivity,
  type ActivityLogSummary,
} from "@/lib/task-activity";
import {
  addTaskComment,
  fetchTaskComments,
  getTaskCommentErrorMessage,
  type TaskCommentSummary,
} from "@/lib/task-comments";
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

const PRIORITY_STRIPE: Record<TaskPriority, string> = {
  Low: "task-detail-priority-low",
  Medium: "task-detail-priority-medium",
  High: "task-detail-priority-high",
  Urgent: "task-detail-priority-urgent",
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
  const [comments, setComments] = useState<TaskCommentSummary[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  const [activity, setActivity] = useState<ActivityLogSummary[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [breakdown, setBreakdown] = useState<TaskBreakdownResult | null>(null);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [breakdownError, setBreakdownError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    setCommentBody("");
    setCommentError(null);
    setBreakdown(null);
    setBreakdownError(null);
  }, [task]);

  const loadComments = useCallback(async () => {
    if (!task) {
      return;
    }

    setCommentsLoading(true);
    setCommentError(null);
    try {
      const data = await fetchTaskComments(task.id);
      setComments(data);
    } catch {
      setCommentError("Could not load comments.");
    } finally {
      setCommentsLoading(false);
    }
  }, [task]);

  const loadActivity = useCallback(async () => {
    if (!task) {
      return;
    }

    setActivityLoading(true);
    try {
      const data = await fetchTaskActivity(task.id);
      setActivity(data);
    } catch {
      setActivity([]);
    } finally {
      setActivityLoading(false);
    }
  }, [task]);

  const refreshSidePanel = useCallback(async () => {
    await Promise.all([loadComments(), loadActivity()]);
  }, [loadActivity, loadComments]);

  useEffect(() => {
    if (!open || !task) {
      return;
    }
    void refreshSidePanel();
  }, [open, task, refreshSidePanel]);

  if (!open || !task || !mounted) {
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

  async function handleAddComment() {
    if (!commentBody.trim()) {
      return;
    }

    setCommentError(null);
    setIsCommentSubmitting(true);
    try {
      const created = await addTaskComment(task!.id, commentBody);
      setComments((current) => [...current, created]);
      setCommentBody("");
      await loadActivity();
    } catch (err) {
      setCommentError(getTaskCommentErrorMessage(err));
    } finally {
      setIsCommentSubmitting(false);
    }
  }

  async function handleBreakDown() {
    if (!task) {
      return;
    }

    setBreakdownError(null);
    setBreakdownLoading(true);
    try {
      const result = await breakDownTask(task.id);
      setBreakdown(result);
    } catch (err) {
      setBreakdown(null);
      setBreakdownError(getAiErrorMessage(err));
    } finally {
      setBreakdownLoading(false);
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

  return createPortal(
    <>
      <button
        type="button"
        className="task-detail-backdrop"
        onClick={onClose}
        aria-label="Close task details"
      />
      <div
        className="task-detail-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-detail-title"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#e7e5e4] px-6 py-5">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#78716c]">Task details</p>
            <h2
              id="task-detail-title"
              className="mt-1 truncate text-xl font-semibold text-[#1c1917]"
            >
              {task.title}
            </h2>
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

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="task-detail-body">
            <div className="task-detail-main">
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span
                className={cn(
                  "task-detail-priority-stripe",
                  PRIORITY_STRIPE[task.priority],
                )}
              >
                {task.priority} priority
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
                    className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
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

            <div className="space-y-3 border-t border-[#e7e5e4] pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[#1c1917]">AI subtasks</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={breakdownLoading}
                  onClick={() => void handleBreakDown()}
                >
                  <Sparkles className="size-4" />
                  {breakdownLoading ? "Generating…" : "Break into subtasks"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Suggestions only — they are not added to the board automatically.
              </p>
              {breakdownError ? (
                <p className="text-sm text-destructive" role="alert">
                  {breakdownError}
                </p>
              ) : null}
              {breakdown?.usedMockProvider ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-950">
                  Demo mode: add an OpenAI API key for live suggestions.
                </p>
              ) : null}
              {breakdown && breakdown.subtasks.length > 0 ? (
                <ul className="space-y-2">
                  {breakdown.subtasks.map((subtask, index) => (
                    <li
                      key={`${subtask.title}-${index}`}
                      className="rounded-lg border border-[#e7e5e4] bg-[#fafaf9] px-3 py-2.5 text-sm"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-[#1c1917]">{subtask.title}</p>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                            PRIORITY_STRIPE[subtask.priority],
                          )}
                        >
                          {subtask.priority}
                        </span>
                      </div>
                      {subtask.description ? (
                        <p className="mt-1 text-[#44403c]">{subtask.description}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : breakdown && !breakdownLoading ? (
                <p className="text-sm text-muted-foreground">No subtasks suggested.</p>
              ) : null}
            </div>

            <div className="space-y-3 border-t border-[#e7e5e4] pt-4">
              <p className="text-sm font-semibold text-[#1c1917]">Activity</p>
              {activityLoading ? (
                <p className="text-sm text-muted-foreground">Loading activity…</p>
              ) : activity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                <ul className="max-h-40 space-y-2 overflow-y-auto">
                  {activity.map((entry) => (
                    <li
                      key={entry.id}
                      className="rounded-lg border border-[#e7e5e4] bg-[#fafaf9] px-3 py-2 text-sm"
                    >
                      <p className="text-[#1c1917]">
                        <span className="font-semibold">{entry.actorName}</span>{" "}
                        {entry.message}
                      </p>
                      <time
                        className="mt-1 block text-[10px] text-[#78716c]"
                        dateTime={entry.createdAt}
                      >
                        {new Date(entry.createdAt).toLocaleString()}
                      </time>
                    </li>
                  ))}
                </ul>
              )}
            </div>

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

            <div className="task-detail-comments">
              <p className="text-sm font-semibold text-[#1c1917]">Comments</p>
              <div className="task-detail-comments-list">
                {commentsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading comments…</p>
                ) : comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No comments yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {comments.map((comment) => (
                      <li
                        key={comment.id}
                        className="rounded-lg border border-[#e7e5e4] bg-white px-3 py-2.5 text-sm"
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="font-semibold text-[#1c1917]">{comment.authorName}</p>
                          <time
                            className="shrink-0 text-[10px] text-[#78716c]"
                            dateTime={comment.createdAt}
                          >
                            {new Date(comment.createdAt).toLocaleString()}
                          </time>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-[#44403c]">{comment.body}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {commentError ? (
                <p className="mt-2 text-sm text-destructive" role="alert">
                  {commentError}
                </p>
              ) : null}
              <div className="mt-4 shrink-0 space-y-2 border-t border-[#e7e5e4] pt-4">
                <Label htmlFor="detail-comment-body">Add a comment</Label>
                <textarea
                  id="detail-comment-body"
                  className="min-h-[4.5rem] w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  placeholder="Write a comment for the team"
                  maxLength={2000}
                />
                <Button
                  type="button"
                  size="sm"
                  className="w-full"
                  disabled={isCommentSubmitting || !commentBody.trim()}
                  onClick={() => void handleAddComment()}
                >
                  {isCommentSubmitting ? "Posting…" : "Post comment"}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[#e7e5e4] px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="dialog-btn-cancel"
              onClick={onClose}
            >
              Cancel
            </Button>
            {canEdit ? (
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving…" : "Save changes"}
              </Button>
            ) : null}
          </div>
        </form>
      </div>
    </>,
    document.body,
  );
}

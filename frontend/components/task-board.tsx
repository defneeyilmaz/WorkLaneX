"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createTask,
  fetchProjectTasks,
  getTaskErrorMessage,
  type TaskPriority,
  type TaskStatus,
  type TaskSummary,
  updateTaskStatus,
} from "@/lib/tasks";
import { cn } from "@/lib/utils";

type TaskBoardProps = {
  projectId: string;
  projectName: string;
};

const STATUSES: TaskStatus[] = ["ToDo", "InProgress", "Review", "Done"];
const STATUS_LABELS: Record<TaskStatus, string> = {
  ToDo: "To Do",
  InProgress: "In Progress",
  Review: "Review",
  Done: "Done",
};

const LANE_CLASSES: Record<TaskStatus, string> = {
  ToDo: "kanban-lane-todo",
  InProgress: "kanban-lane-progress",
  Review: "kanban-lane-review",
  Done: "kanban-lane-done",
};

const PRIORITY_CLASSES: Record<TaskPriority, string> = {
  Low: "bg-slate-100 text-slate-700",
  Medium: "bg-sky-100 text-sky-800",
  High: "bg-amber-100 text-amber-900",
  Urgent: "bg-rose-100 text-rose-900",
};

export function TaskBoard({ projectId, projectName }: TaskBoardProps) {
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("Medium");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const groupedTasks = useMemo(
    () =>
      STATUSES.reduce<Record<TaskStatus, TaskSummary[]>>((acc, status) => {
        acc[status] = tasks.filter((task) => task.status === status);
        return acc;
      }, { ToDo: [], InProgress: [], Review: [], Done: [] }),
    [tasks],
  );

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchProjectTasks(projectId);
      setTasks(data);
    } catch {
      setError("Could not load tasks.");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  async function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const created = await createTask(projectId, title.trim(), description, priority);
      setTasks((current) => [created, ...current]);
      setTitle("");
      setDescription("");
      setPriority("Medium");
    } catch (err) {
      setError(getTaskErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleMoveTask(taskId: string, status: TaskStatus) {
    try {
      const updated = await updateTaskStatus(taskId, status);
      setTasks((current) => current.map((task) => (task.id === taskId ? updated : task)));
    } catch (err) {
      setError(getTaskErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card border-none py-5 text-base">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            Tasks in {projectName}
          </CardTitle>
          <CardDescription className="text-base">
            Drag-free lanes with quick status updates for now.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-base text-muted-foreground">Loading tasks…</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {STATUSES.map((status) => (
                <div
                  key={status}
                  className={cn("kanban-lane", LANE_CLASSES[status])}
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-base font-semibold">{STATUS_LABELS[status]}</p>
                    <span className="lane-badge">{groupedTasks[status].length}</span>
                  </div>
                  {groupedTasks[status].length === 0 ? (
                    <p className="rounded-xl border border-dashed border-white/80 bg-white/50 px-3 py-5 text-center text-sm text-muted-foreground">
                      Drop tasks here later — lane is empty for now.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {groupedTasks[status].map((task) => (
                        <li key={task.id} className="task-card">
                          <p className="text-base font-medium">{task.title}</p>
                          {task.description ? (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {task.description}
                            </p>
                          ) : null}
                          <div className="mt-3 flex items-center justify-between gap-2">
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-xs font-semibold",
                                PRIORITY_CLASSES[task.priority],
                              )}
                            >
                              {task.priority}
                            </span>
                            <select
                              className="rounded-lg border border-white/80 bg-white/90 px-2 py-1 text-sm shadow-sm transition-colors hover:border-[var(--board-accent)]/40"
                              value={task.status}
                              onChange={(e) =>
                                handleMoveTask(task.id, e.target.value as TaskStatus)
                              }
                            >
                              {STATUSES.map((option) => (
                                <option key={option} value={option}>
                                  {STATUS_LABELS[option]}
                                </option>
                              ))}
                            </select>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card border-none py-5 text-base">
        <CardHeader>
          <CardTitle className="text-2xl">New task</CardTitle>
          <CardDescription>Add a task to the selected project.</CardDescription>
        </CardHeader>
        <form onSubmit={handleCreateTask}>
          <CardContent className="space-y-4 pb-4">
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                className="h-11 text-base"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Design onboarding flow"
                required
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-description">Description (optional)</Label>
              <Input
                id="task-description"
                className="h-11 text-base"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail for this task"
                maxLength={2000}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-priority">Priority</Label>
              <select
                id="task-priority"
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
          </CardContent>
          <div className="flex items-center rounded-b-2xl border-t border-white/50 bg-white/40 p-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create task"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

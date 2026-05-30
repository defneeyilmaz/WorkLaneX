"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { GripVertical } from "lucide-react";

import { TaskDetailDrawer } from "@/components/task-detail-drawer";
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

function laneId(status: TaskStatus) {
  return `lane-${status}`;
}

function parseLaneStatus(id: string | number): TaskStatus | null {
  if (typeof id !== "string" || !id.startsWith("lane-")) {
    return null;
  }

  const status = id.slice(5) as TaskStatus;
  return STATUSES.includes(status) ? status : null;
}

type KanbanTaskCardProps = {
  task: TaskSummary;
  onOpen: (task: TaskSummary) => void;
  isDragging?: boolean;
};

function KanbanTaskCard({ task, onOpen, isDragging }: KanbanTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn("task-card", isDragging && "task-card-dragging")}
    >
      <div className="flex gap-2">
        <button
          type="button"
          className="mt-0.5 shrink-0 cursor-grab rounded-md p-1 text-muted-foreground transition-colors hover:bg-white/80 hover:text-foreground active:cursor-grabbing"
          aria-label={`Drag ${task.title}`}
          {...listeners}
          {...attributes}
        >
          <GripVertical className="size-4" />
        </button>

        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={() => onOpen(task)}
        >
          <p className="text-base font-medium">{task.title}</p>
          {task.description ? (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {task.description}
            </p>
          ) : null}
          <div className="mt-3">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-semibold",
                PRIORITY_CLASSES[task.priority],
              )}
            >
              {task.priority}
            </span>
          </div>
        </button>
      </div>
    </li>
  );
}

type KanbanLaneProps = {
  status: TaskStatus;
  tasks: TaskSummary[];
  onOpenTask: (task: TaskSummary) => void;
  activeTaskId: string | null;
};

function KanbanLane({ status, tasks, onOpenTask, activeTaskId }: KanbanLaneProps) {
  const { setNodeRef, isOver } = useDroppable({ id: laneId(status) });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "kanban-lane min-h-[220px]",
        LANE_CLASSES[status],
        isOver && "kanban-lane-drop-active",
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-base font-semibold">{STATUS_LABELS[status]}</p>
        <span className="lane-badge">{tasks.length}</span>
      </div>

      {tasks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/80 bg-white/50 px-3 py-5 text-center text-sm text-muted-foreground">
          Drop tasks here
        </p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <KanbanTaskCard
              key={task.id}
              task={task}
              onOpen={onOpenTask}
              isDragging={activeTaskId === task.id}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export function TaskBoard({ projectId, projectName }: TaskBoardProps) {
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("Medium");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTask, setActiveTask] = useState<TaskSummary | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskSummary | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

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

  function handleOpenTask(task: TaskSummary) {
    setSelectedTask(task);
    setDrawerOpen(true);
  }

  function handleCloseDrawer() {
    setDrawerOpen(false);
    setSelectedTask(null);
  }

  function handleTaskSaved(updated: TaskSummary) {
    setTasks((current) =>
      current.map((task) => (task.id === updated.id ? updated : task)),
    );
  }

  async function handleMoveTask(taskId: string, status: TaskStatus) {
    const previousTasks = tasks;
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, status } : task)),
    );

    try {
      const updated = await updateTaskStatus(taskId, status);
      setTasks((current) =>
        current.map((task) => (task.id === taskId ? updated : task)),
      );
    } catch (err) {
      setTasks(previousTasks);
      setError(getTaskErrorMessage(err));
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((item) => item.id === event.active.id);
    setActiveTask(task ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);

    const taskId = String(event.active.id);
    if (!event.over) {
      return;
    }

    let nextStatus = parseLaneStatus(event.over.id);
    if (!nextStatus) {
      const overTask = tasks.find((item) => item.id === event.over!.id);
      nextStatus = overTask?.status ?? null;
    }

    const task = tasks.find((item) => item.id === taskId);
    if (!task || !nextStatus || task.status === nextStatus) {
      return;
    }

    void handleMoveTask(taskId, nextStatus);
  }

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

  return (
    <div className="space-y-6">
      <Card className="glass-card border-none py-5 text-base">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            Tasks in {projectName}
          </CardTitle>
          <CardDescription className="text-base">
            Drag cards between lanes or open a task to edit details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="mb-4 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          {isLoading ? (
            <p className="text-base text-muted-foreground">Loading tasks…</p>
          ) : (
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {STATUSES.map((status) => (
                  <KanbanLane
                    key={status}
                    status={status}
                    tasks={groupedTasks[status]}
                    onOpenTask={handleOpenTask}
                    activeTaskId={activeTask?.id ?? null}
                  />
                ))}
              </div>

              <DragOverlay>
                {activeTask ? (
                  <div className="task-card task-card-overlay">
                    <p className="text-base font-medium">{activeTask.title}</p>
                    {activeTask.description ? (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {activeTask.description}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
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

      <TaskDetailDrawer
        task={selectedTask}
        open={drawerOpen}
        onClose={handleCloseDrawer}
        onSaved={handleTaskSaved}
      />
    </div>
  );
}

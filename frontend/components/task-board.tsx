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
  type DropAnimation,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, GripVertical, Plus, X } from "lucide-react";

import { CreateTaskDialog } from "@/components/create-task-dialog";
import { TaskDetailDrawer } from "@/components/task-detail-drawer";
import { Button } from "@/components/ui/button";
import {
  canApproveTasks,
  canCreateTask,
  canInteractWithTask,
  isForwardStatusTransition,
  isManagerRole,
  normalizeWorkspaceRole,
} from "@/lib/permissions";
import {
  approveTask,
  fetchProjectTasks,
  getTaskErrorMessage,
  type TaskPriority,
  type TaskStatus,
  type TaskSummary,
  updateTaskStatus,
} from "@/lib/tasks";
import {
  fetchWorkspaceMembers,
  type WorkspaceMemberSummary,
  type WorkspaceRole,
} from "@/lib/workspaces";
import { cn } from "@/lib/utils";

type TaskBoardProps = {
  projectId: string;
  projectName: string;
  workspaceId: string;
  workspaceRole: WorkspaceRole;
  userId: string;
  searchQuery?: string;
};

const STATUSES: TaskStatus[] = ["ToDo", "InProgress", "Review", "Done"];
const STATUS_LABELS: Record<TaskStatus, string> = {
  ToDo: "To Do",
  InProgress: "In Progress",
  Review: "Review",
  Done: "Done",
};

const PRIORITY_PILL: Record<TaskPriority, string> = {
  Low: "task-priority-low",
  Medium: "task-priority-medium",
  High: "task-priority-high",
  Urgent: "task-priority-urgent",
};

const PRIORITY_NUMBER: Record<TaskPriority, number> = {
  Urgent: 1,
  High: 2,
  Medium: 3,
  Low: 4,
};

function TaskCardLabels({ priority }: { priority: TaskPriority }) {
  return (
    <div className="task-card-labels">
      <span className="task-type-pill">Task</span>
      <span
        className={cn("task-priority-badge", PRIORITY_PILL[priority])}
        aria-label={`Priority ${PRIORITY_NUMBER[priority]}`}
      >
        {PRIORITY_NUMBER[priority]}
      </span>
    </div>
  );
}

const STATUS_HINT: Record<TaskStatus, string> = {
  ToDo: "Not started yet",
  InProgress: "In progress",
  Review: "In review",
  Done: "Completed",
};

const AVATAR_COLORS = ["#ea580c", "#f97316", "#00875a", "#be123c", "#b45309"];

const dropAnimation: DropAnimation = {
  duration: 280,
  easing: "cubic-bezier(0.34, 1.45, 0.64, 1)",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function avatarColor(name: string) {
  const code = name.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

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

function taskCardClass(task: TaskSummary, interactive: boolean) {
  return cn(
    "task-card",
    !interactive && "task-card-readonly",
    task.approvalStatus === "Approved" && "task-card-approved",
    task.approvalStatus === "Rejected" && "task-card-rejected",
    task.approvalStatus === "Pending" && "task-pending-approval",
  );
}

type KanbanTaskCardProps = {
  task: TaskSummary;
  interactive: boolean;
  canApprove: boolean;
  onOpen: (task: TaskSummary) => void;
  onApprove: (taskId: string) => void;
  onReject: (task: TaskSummary) => void;
  isDragging?: boolean;
  justLanded?: boolean;
  onLandAnimationEnd?: () => void;
};

function KanbanTaskCard({
  task,
  interactive,
  canApprove,
  onOpen,
  onApprove,
  onReject,
  isDragging,
  justLanded,
  onLandAnimationEnd,
}: KanbanTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
    disabled: !interactive,
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        taskCardClass(task, interactive),
        isDragging && "task-card-dragging",
        justLanded && "task-card-land",
      )}
      onAnimationEnd={() => {
        if (justLanded) {
          onLandAnimationEnd?.();
        }
      }}
    >
      <div className="flex gap-2">
        {interactive ? (
          <button
            type="button"
            className="mt-0.5 shrink-0 cursor-grab rounded p-0.5 text-[#7a869a] hover:text-[#172b4d] active:cursor-grabbing"
            aria-label={`Drag ${task.title}`}
            {...listeners}
            {...attributes}
          >
            <GripVertical className="size-4" />
          </button>
        ) : null}

        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={() => onOpen(task)}
        >
          <TaskCardLabels priority={task.priority} />
          <p className="mt-2 text-base font-medium text-[#1c1917]">{task.title}</p>
          <div className="task-card-footer">
            <span className="text-sm text-[#78716c]">
              {task.approvalStatus === "Pending"
                ? "Awaiting approval"
                : STATUS_HINT[task.status]}
            </span>
            {task.assigneeName ? (
              <span
                className="task-assignee-avatar"
                style={{ backgroundColor: avatarColor(task.assigneeName) }}
                title={task.assigneeName}
              >
                {getInitials(task.assigneeName)}
              </span>
            ) : null}
          </div>
          {task.approvalStatus === "Pending" ? (
            <span className="mt-2 inline-block rounded bg-[#fff0b3] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#974f0c]">
              Pending
            </span>
          ) : null}
          {task.rejectionNote ? (
            <p className="mt-2 text-xs text-[#de350b]">{task.rejectionNote}</p>
          ) : null}
        </button>
      </div>

      {canApprove && task.approvalStatus === "Pending" ? (
        <div className="mt-3 flex gap-2 border-t border-[#dfe1e6] pt-3">
          <Button
            type="button"
            size="sm"
            className="flex-1"
            onClick={() => onApprove(task.id)}
          >
            <Check className="size-3.5" />
            Accept
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => onReject(task)}
          >
            <X className="size-3.5" />
            Reject
          </Button>
        </div>
      ) : null}
    </li>
  );
}

type KanbanLaneProps = {
  status: TaskStatus;
  tasks: TaskSummary[];
  role: WorkspaceRole;
  userId: string;
  onOpenTask: (task: TaskSummary) => void;
  onApprove: (taskId: string) => void;
  onReject: (task: TaskSummary) => void;
  onRequestCreate?: () => void;
  activeTaskId: string | null;
  landingTaskId: string | null;
  receivingPulse: boolean;
  onLandAnimationEnd: () => void;
};

function KanbanLane({
  status,
  tasks,
  role,
  userId,
  onOpenTask,
  onApprove,
  onReject,
  onRequestCreate,
  activeTaskId,
  landingTaskId,
  receivingPulse,
  onLandAnimationEnd,
}: KanbanLaneProps) {
  const { setNodeRef, isOver } = useDroppable({ id: laneId(status) });
  const normalizedRole = normalizeWorkspaceRole(role);
  const canApprove = canApproveTasks(normalizedRole);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "kanban-lane",
        isOver && "kanban-lane-drop-active",
        receivingPulse && "kanban-lane-receive",
      )}
    >
      <div className="lane-header">
        <div className="flex min-w-0 items-center gap-2">
          <p className="lane-title">{STATUS_LABELS[status]}</p>
          {status === "ToDo" && onRequestCreate ? (
            <button
              type="button"
              onClick={onRequestCreate}
              className="lane-add-btn"
              aria-label="Create task"
            >
              <Plus className="size-4" strokeWidth={2.5} />
            </button>
          ) : null}
        </div>
        <span className="lane-count">{tasks.length}</span>
      </div>

      {tasks.length === 0 ? (
        <div className="lane-body">
          <p className="lane-empty">Drop tasks here</p>
        </div>
      ) : (
        <div className="lane-body">
          <ul className="lane-task-list">
            {tasks.map((task) => {
              const interactive = canInteractWithTask(normalizedRole, task, userId);
              return (
                <KanbanTaskCard
                  key={task.id}
                  task={task}
                  interactive={interactive}
                  canApprove={canApprove}
                  onOpen={onOpenTask}
                  onApprove={onApprove}
                  onReject={onReject}
                  isDragging={activeTaskId === task.id}
                  justLanded={landingTaskId === task.id}
                  onLandAnimationEnd={onLandAnimationEnd}
                />
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export function TaskBoard({
  projectId,
  projectName,
  workspaceId,
  workspaceRole,
  userId,
  searchQuery = "",
}: TaskBoardProps) {
  const role = normalizeWorkspaceRole(workspaceRole);
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [members, setMembers] = useState<WorkspaceMemberSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<TaskSummary | null>(null);
  const [landingTaskId, setLandingTaskId] = useState<string | null>(null);
  const [landingLane, setLandingLane] = useState<TaskStatus | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskSummary | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const visibleTasks = useMemo(() => {
    if (!normalizedSearch) {
      return tasks;
    }
    return tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(normalizedSearch) ||
        task.description?.toLowerCase().includes(normalizedSearch) ||
        task.assigneeName?.toLowerCase().includes(normalizedSearch),
    );
  }, [normalizedSearch, tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const groupedTasks = useMemo(
    () =>
      STATUSES.reduce<Record<TaskStatus, TaskSummary[]>>((acc, status) => {
        acc[status] = visibleTasks.filter((task) => task.status === status);
        return acc;
      }, { ToDo: [], InProgress: [], Review: [], Done: [] }),
    [visibleTasks],
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

  const loadMembers = useCallback(async () => {
    if (!isManagerRole(role)) {
      return;
    }
    try {
      const data = await fetchWorkspaceMembers(workspaceId);
      setMembers(data);
    } catch {
      // Members are optional for board rendering.
    }
  }, [role, workspaceId]);

  useEffect(() => {
    loadTasks();
    loadMembers();
  }, [loadTasks, loadMembers]);

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

  function clearLandingAnimation() {
    setLandingTaskId(null);
    setLandingLane(null);
  }

  async function handleMoveTask(taskId: string, status: TaskStatus) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
      return;
    }

    if (!isManagerRole(role)) {
      if (!canInteractWithTask(role, task, userId)) {
        setError("You can only move tasks assigned to you.");
        return;
      }
      if (!isForwardStatusTransition(task.status, status)) {
        setError("You can only move a task forward.");
        return;
      }
    }

    const previousTasks = tasks;
    setTasks((current) =>
      current.map((item) =>
        item.id === taskId
          ? {
              ...item,
              status,
              approvalStatus:
                status === "Done" && !isManagerRole(role) ? "Pending" : item.approvalStatus,
            }
          : item,
      ),
    );

    try {
      const updated = await updateTaskStatus(taskId, status);
      setTasks((current) =>
        current.map((item) => (item.id === taskId ? updated : item)),
      );
    } catch (err) {
      setTasks(previousTasks);
      clearLandingAnimation();
      setError(getTaskErrorMessage(err));
    }
  }

  async function handleApprove(taskId: string) {
    try {
      const updated = await approveTask(taskId);
      handleTaskSaved(updated);
    } catch (err) {
      setError(getTaskErrorMessage(err));
    }
  }

  async function handleReject(task: TaskSummary) {
    setSelectedTask(task);
    setDrawerOpen(true);
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

    setLandingTaskId(taskId);
    setLandingLane(nextStatus);
    void handleMoveTask(taskId, nextStatus);
  }

  function handleTaskCreated(created: TaskSummary) {
    setTasks((current) => [created, ...current]);
  }

  return (
    <div>
      {error ? (
        <p className="mb-4 rounded-md bg-[#ffebe6] px-3 py-2 text-sm text-[#bf2600]" role="alert">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <p className="text-base text-[#78716c]">Loading tasks…</p>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {STATUSES.map((status) => (
              <KanbanLane
                key={status}
                status={status}
                tasks={groupedTasks[status]}
                role={role}
                userId={userId}
                onOpenTask={handleOpenTask}
                onApprove={handleApprove}
                onReject={handleReject}
                onRequestCreate={
                  canCreateTask(role) ? () => setCreateOpen(true) : undefined
                }
                activeTaskId={activeTask?.id ?? null}
                landingTaskId={landingTaskId}
                receivingPulse={landingLane === status}
                onLandAnimationEnd={clearLandingAnimation}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={dropAnimation}>
            {activeTask ? (
              <div className={cn("task-card task-card-overlay", taskCardClass(activeTask, true))}>
                <TaskCardLabels priority={activeTask.priority} />
                <p className="mt-2 text-base font-medium">{activeTask.title}</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {canCreateTask(role) ? (
        <CreateTaskDialog
          open={createOpen}
          projectId={projectId}
          projectName={projectName}
          members={members}
          onClose={() => setCreateOpen(false)}
          onCreated={handleTaskCreated}
        />
      ) : null}

      <TaskDetailDrawer
        task={selectedTask}
        open={drawerOpen}
        workspaceRole={role}
        userId={userId}
        members={members}
        onClose={handleCloseDrawer}
        onSaved={handleTaskSaved}
      />
    </div>
  );
}

import type { TaskPriority, TaskStatus, TaskSummary } from "@/lib/tasks";

export type AssigneeFilter = "all" | "mine" | "unassigned" | string;

export type BoardFilters = {
  assignee: AssigneeFilter;
  priorities: TaskPriority[];
  statuses: TaskStatus[];
};

export const DEFAULT_BOARD_FILTERS: BoardFilters = {
  assignee: "all",
  priorities: [],
  statuses: [],
};

export const BOARD_PRIORITY_OPTIONS: TaskPriority[] = [
  "Low",
  "Medium",
  "High",
  "Urgent",
];

export const BOARD_STATUS_OPTIONS: TaskStatus[] = [
  "ToDo",
  "InProgress",
  "Review",
  "Done",
];

export function countActiveBoardFilters(filters: BoardFilters): number {
  let count = 0;
  if (filters.assignee !== "all") {
    count += 1;
  }
  if (filters.priorities.length > 0) {
    count += 1;
  }
  if (filters.statuses.length > 0) {
    count += 1;
  }
  return count;
}

export function applyBoardFilters(
  tasks: TaskSummary[],
  filters: BoardFilters,
  userId: string,
  searchQuery: string,
): TaskSummary[] {
  const normalizedSearch = searchQuery.trim().toLowerCase();
  let result = tasks;

  if (normalizedSearch) {
    result = result.filter(
      (task) =>
        task.title.toLowerCase().includes(normalizedSearch) ||
        task.description?.toLowerCase().includes(normalizedSearch) ||
        task.assigneeName?.toLowerCase().includes(normalizedSearch),
    );
  }

  if (filters.assignee === "mine") {
    result = result.filter((task) => task.assigneeId === userId);
  } else if (filters.assignee === "unassigned") {
    result = result.filter((task) => !task.assigneeId);
  } else if (filters.assignee !== "all") {
    result = result.filter((task) => task.assigneeId === filters.assignee);
  }

  if (filters.priorities.length > 0) {
    result = result.filter((task) => filters.priorities.includes(task.priority));
  }

  if (filters.statuses.length > 0) {
    result = result.filter((task) => filters.statuses.includes(task.status));
  }

  return result;
}

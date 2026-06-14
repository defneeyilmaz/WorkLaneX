"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";

import {
  BOARD_PRIORITY_OPTIONS,
  BOARD_STATUS_OPTIONS,
  countActiveBoardFilters,
  DEFAULT_BOARD_FILTERS,
  type BoardFilters,
} from "@/lib/board-filters";
import type { TaskPriority, TaskStatus } from "@/lib/tasks";
import { fetchWorkspaceMembers, type WorkspaceMemberSummary } from "@/lib/workspaces";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<TaskStatus, string> = {
  ToDo: "To Do",
  InProgress: "In Progress",
  Review: "Review",
  Done: "Done",
};

type BoardQuickFiltersProps = {
  workspaceId: string;
  userId: string;
  filters: BoardFilters;
  onChange: (filters: BoardFilters) => void;
};

export function BoardQuickFilters({
  workspaceId,
  userId,
  filters,
  onChange,
}: BoardQuickFiltersProps) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<WorkspaceMemberSummary[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  const activeCount = countActiveBoardFilters(filters);

  useEffect(() => {
    let cancelled = false;

    fetchWorkspaceMembers(workspaceId)
      .then((data) => {
        if (!cancelled) {
          setMembers(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMembers([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const togglePriority = useCallback(
    (priority: TaskPriority) => {
      onChange({
        ...filters,
        priorities: filters.priorities.includes(priority)
          ? filters.priorities.filter((item) => item !== priority)
          : [...filters.priorities, priority],
      });
    },
    [filters, onChange],
  );

  const toggleStatus = useCallback(
    (status: TaskStatus) => {
      onChange({
        ...filters,
        statuses: filters.statuses.includes(status)
          ? filters.statuses.filter((item) => item !== status)
          : [...filters.statuses, status],
      });
    },
    [filters, onChange],
  );

  return (
    <div ref={rootRef} className="board-quick-filters">
      <button
        type="button"
        className={cn("jira-filter-btn gap-1.5", activeCount > 0 && "board-quick-filters-active")}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((current) => !current)}
      >
        Quick filters
        {activeCount > 0 ? (
          <span className="board-quick-filters-badge">{activeCount}</span>
        ) : null}
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
      </button>

      {open ? (
        <div className="board-quick-filters-panel" role="dialog" aria-label="Board filters">
          <div className="board-quick-filters-header">
            <p className="board-quick-filters-title">Filter tasks</p>
            {activeCount > 0 ? (
              <button
                type="button"
                className="board-quick-filters-clear"
                onClick={() => onChange(DEFAULT_BOARD_FILTERS)}
              >
                Clear all
              </button>
            ) : null}
          </div>

          <div className="board-quick-filters-section">
            <p className="board-quick-filters-label">Assignee</p>
            <div className="board-quick-filters-chips">
              {[
                { value: "all" as const, label: "All" },
                { value: "mine" as const, label: "Assigned to me" },
                { value: "unassigned" as const, label: "Unassigned" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={cn(
                    "board-quick-filters-chip",
                    filters.assignee === option.value && "board-quick-filters-chip-active",
                  )}
                  onClick={() => onChange({ ...filters, assignee: option.value })}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {members.length > 0 ? (
              <select
                className="board-quick-filters-select"
                value={
                  filters.assignee !== "all" &&
                  filters.assignee !== "mine" &&
                  filters.assignee !== "unassigned"
                    ? filters.assignee
                    : ""
                }
                onChange={(event) => {
                  const value = event.target.value;
                  onChange({
                    ...filters,
                    assignee: value || "all",
                  });
                }}
              >
                <option value="">Filter by teammate…</option>
                {members.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.fullName}
                    {member.userId === userId ? " (you)" : ""}
                  </option>
                ))}
              </select>
            ) : null}
          </div>

          <div className="board-quick-filters-section">
            <p className="board-quick-filters-label">Priority</p>
            <div className="board-quick-filters-chips">
              {BOARD_PRIORITY_OPTIONS.map((priority) => (
                <button
                  key={priority}
                  type="button"
                  className={cn(
                    "board-quick-filters-chip",
                    filters.priorities.includes(priority) && "board-quick-filters-chip-active",
                  )}
                  onClick={() => togglePriority(priority)}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>

          <div className="board-quick-filters-section">
            <p className="board-quick-filters-label">Status</p>
            <div className="board-quick-filters-chips">
              {BOARD_STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  type="button"
                  className={cn(
                    "board-quick-filters-chip",
                    filters.statuses.includes(status) && "board-quick-filters-chip-active",
                  )}
                  onClick={() => toggleStatus(status)}
                >
                  {STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>

          <div className="board-quick-filters-presets">
            <button
              type="button"
              className="board-quick-filters-preset"
              onClick={() =>
                onChange({
                  assignee: "mine",
                  priorities: [],
                  statuses: [],
                })
              }
            >
              My open work
            </button>
            <button
              type="button"
              className="board-quick-filters-preset"
              onClick={() =>
                onChange({
                  assignee: "all",
                  priorities: ["High", "Urgent"],
                  statuses: [],
                })
              }
            >
              High priority
            </button>
          </div>

          <button
            type="button"
            className="board-quick-filters-close"
            aria-label="Close filters"
            onClick={() => setOpen(false)}
          >
            <X className="size-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

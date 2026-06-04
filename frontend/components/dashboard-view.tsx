"use client";

import { useCallback, useEffect, useState } from "react";

import {
  fetchWorkspaceDashboard,
  getDashboardErrorMessage,
  type DashboardTaskSummary,
  type WorkspaceDashboardSummary,
} from "@/lib/dashboard";
import { canApproveTasks, normalizeWorkspaceRole } from "@/lib/permissions";
import type { TaskStatus } from "@/lib/tasks";
import type { WorkspaceRole } from "@/lib/workspaces";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<TaskStatus, string> = {
  ToDo: "To Do",
  InProgress: "In Progress",
  Review: "Review",
  Done: "Done",
};

const PRIORITY_STRIPE: Record<DashboardTaskSummary["priority"], string> = {
  Low: "task-card-priority-low",
  Medium: "task-card-priority-medium",
  High: "task-card-priority-high",
  Urgent: "task-card-priority-urgent",
};

type DashboardViewProps = {
  workspaceId: string;
  workspaceRole: WorkspaceRole;
  onOpenBoard: (projectId: string) => void;
};

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="dashboard-stat-card">
      <p className="dashboard-stat-label">{label}</p>
      <p className="dashboard-stat-value">{value}</p>
      {hint ? <p className="dashboard-stat-hint">{hint}</p> : null}
    </div>
  );
}

function TaskRow({
  task,
  onOpen,
}: {
  task: DashboardTaskSummary;
  onOpen: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "dashboard-task-row w-full text-left",
          PRIORITY_STRIPE[task.priority],
        )}
      >
        <p className="font-medium text-[#1c1917]">{task.title}</p>
        <p className="mt-1 text-sm text-[#78716c]">
          {task.projectName} · {STATUS_LABELS[task.status]}
        </p>
      </button>
    </li>
  );
}

export function DashboardView({
  workspaceId,
  workspaceRole,
  onOpenBoard,
}: DashboardViewProps) {
  const role = normalizeWorkspaceRole(workspaceRole);
  const showApprovals = canApproveTasks(role);

  const [data, setData] = useState<WorkspaceDashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const summary = await fetchWorkspaceDashboard(workspaceId);
      setData(summary);
    } catch (err) {
      setData(null);
      setError(getDashboardErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  if (isLoading) {
    return <p className="text-base text-[#78716c]">Loading dashboard…</p>;
  }

  if (error) {
    return (
      <p className="rounded-md bg-[#ffebe6] px-3 py-2 text-sm text-[#bf2600]" role="alert">
        {error}
      </p>
    );
  }

  if (!data) {
    return null;
  }

  const myTaskCount = data.myTasks.length;

  return (
    <div className="dashboard-view space-y-6">
      <div className="dashboard-stat-grid">
        <StatCard label="My open tasks" value={myTaskCount} />
        {showApprovals ? (
          <StatCard
            label="Pending approval"
            value={data.pendingApprovalCount}
            hint="Awaiting manager review"
          />
        ) : null}
        <StatCard label="Total open" value={data.totalOpenTasks} />
        <StatCard label="Projects" value={data.projects.length} />
      </div>

      <div className="dashboard-status-grid">
        {data.tasksByStatus.map((item) => (
          <div key={item.status} className="dashboard-status-card">
            <p className="dashboard-status-count">{item.count}</p>
            <p className="dashboard-status-label">{STATUS_LABELS[item.status]}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="dashboard-panel">
          <h2 className="dashboard-panel-title">My tasks</h2>
          {data.myTasks.length === 0 ? (
            <p className="text-sm text-[#78716c]">No open tasks assigned to you.</p>
          ) : (
            <ul className="space-y-2">
              {data.myTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onOpen={() => onOpenBoard(task.projectId)}
                />
              ))}
            </ul>
          )}
        </section>

        <section className="dashboard-panel">
          <h2 className="dashboard-panel-title">Recent activity</h2>
          {data.recentActivity.length === 0 ? (
            <p className="text-sm text-[#78716c]">No activity yet.</p>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-y-auto">
              {data.recentActivity.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-lg border border-[#e7e5e4] bg-[#fafaf9] px-3 py-2 text-sm"
                >
                  <p className="text-[#1c1917]">
                    <span className="font-semibold">{entry.actorName}</span>{" "}
                    {entry.message}
                  </p>
                  <p className="mt-1 text-xs text-[#78716c]">
                    {entry.taskTitle} · {entry.projectName}
                  </p>
                  <time
                    className="mt-1 block text-[10px] text-[#a8a29e]"
                    dateTime={entry.createdAt}
                  >
                    {new Date(entry.createdAt).toLocaleString()}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {showApprovals && data.pendingApprovalTasks.length > 0 ? (
        <section className="dashboard-panel">
          <h2 className="dashboard-panel-title">Pending approval</h2>
          <ul className="space-y-2">
            {data.pendingApprovalTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onOpen={() => onOpenBoard(task.projectId)}
              />
            ))}
          </ul>
        </section>
      ) : null}

      <section className="dashboard-panel">
        <h2 className="dashboard-panel-title">Projects</h2>
        {data.projects.length === 0 ? (
          <p className="text-sm text-[#78716c]">No projects in this workspace.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {data.projects.map((project) => (
              <li key={project.id}>
                <button
                  type="button"
                  onClick={() => onOpenBoard(project.id)}
                  className="dashboard-project-card w-full text-left"
                >
                  <p className="font-medium text-[#1c1917]">{project.name}</p>
                  <p className="mt-1 text-sm text-[#78716c]">
                    {project.openTaskCount} open{" "}
                    {project.openTaskCount === 1 ? "task" : "tasks"}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

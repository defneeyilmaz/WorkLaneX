"use client";

import { useCallback, useEffect, useState } from "react";
import { FolderKanban, LayoutDashboard, LayoutGrid } from "lucide-react";

import type { MainView } from "@/app/app/page";
import { SidebarFlyoutSection } from "@/components/sidebar-flyout-section";
import { cn } from "@/lib/utils";
import { fetchMyWorkspaces, formatWorkspaceRole, type WorkspaceSummary } from "@/lib/workspaces";
import { fetchWorkspaceProjects, type ProjectSummary } from "@/lib/projects";

type MemberProjectSidebarProps = {
  selectedWorkspaceId: string | null;
  selectedProjectId: string | null;
  mainView: MainView;
  onSelectWorkspace: (workspace: WorkspaceSummary) => void;
  onSelectProject: (project: ProjectSummary) => void;
  onShowDashboard: () => void;
  onShowBoard: () => void;
};

export function MemberProjectSidebar({
  selectedWorkspaceId,
  selectedProjectId,
  mainView,
  onSelectWorkspace,
  onSelectProject,
  onShowDashboard,
  onShowBoard,
}: MemberProjectSidebarProps) {
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMyWorkspaces()
      .then((data) => {
        setWorkspaces(data);
        if (data.length > 0 && !selectedWorkspaceId) {
          onSelectWorkspace(data[0]);
        }
      })
      .catch(() => setError("Could not load workspaces."));
  }, [onSelectWorkspace, selectedWorkspaceId]);

  const loadProjects = useCallback(async (workspaceId: string) => {
    try {
      const data = await fetchWorkspaceProjects(workspaceId);
      setProjects(data);
    } catch {
      setError("Could not load projects.");
    }
  }, []);

  useEffect(() => {
    if (selectedWorkspaceId) {
      void loadProjects(selectedWorkspaceId);
    }
  }, [loadProjects, selectedWorkspaceId]);

  const selectedWorkspace = workspaces.find((w) => w.id === selectedWorkspaceId);

  return (
    <>
      {workspaces.length > 1 ? (
        <>
          <div className="jira-sidebar-label-wrap">
            <p className="jira-sidebar-label">Workspace</p>
          </div>
          <select
            className="jira-sidebar-input mx-3 mb-2 w-[calc(100%-1.5rem)]"
            value={selectedWorkspaceId ?? ""}
            onChange={(e) => {
              const workspace = workspaces.find((item) => item.id === e.target.value);
              if (workspace) {
                onSelectWorkspace(workspace);
              }
            }}
          >
            {workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id} className="text-black">
                {workspace.name}
              </option>
            ))}
          </select>
        </>
      ) : null}

      <div className="space-y-1 px-2 pt-2">
        <button
          type="button"
          onClick={onShowDashboard}
          className={cn(
            "jira-nav-item",
            mainView === "dashboard" && "jira-nav-item-active",
          )}
        >
          <LayoutDashboard className="shrink-0" />
          <span>Dashboard</span>
        </button>
        <button
          type="button"
          onClick={onShowBoard}
          className={cn("jira-nav-item", mainView === "board" && "jira-nav-item-active")}
        >
          <LayoutGrid className="shrink-0" />
          <span>Board</span>
        </button>
      </div>

      <SidebarFlyoutSection title="Projects">
        {selectedWorkspace ? (
          <p className="sidebar-flyout-meta pb-1 pt-0">
            {selectedWorkspace.name} · {formatWorkspaceRole(selectedWorkspace.role)}
          </p>
        ) : null}

        {error ? (
          <p className="sidebar-flyout-meta text-[#bf2600]" role="alert">
            {error}
          </p>
        ) : projects.length === 0 ? (
          <p className="sidebar-flyout-meta">No projects available.</p>
        ) : (
          <ul className="sidebar-flyout-list">
            {projects.map((project) => (
              <li key={project.id}>
                <button
                  type="button"
                  onClick={() => onSelectProject(project)}
                  className={cn(
                    "sidebar-flyout-item-row",
                    project.id === selectedProjectId && "sidebar-flyout-item-row-active",
                  )}
                >
                  <FolderKanban className="size-4 shrink-0 opacity-80" />
                  <span className="truncate">{project.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </SidebarFlyoutSection>
    </>
  );
}

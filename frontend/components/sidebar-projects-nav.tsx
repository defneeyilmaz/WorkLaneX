"use client";

import { useCallback, useEffect, useState } from "react";
import { FolderKanban, Plus } from "lucide-react";

import { CreateProjectDialog } from "@/components/create-project-dialog";
import { LoadingState } from "@/components/loading-state";
import { SidebarFlyoutSection } from "@/components/sidebar-flyout-section";
import { SELECTED_PROJECT_KEY } from "@/lib/app-navigation";
import { cn } from "@/lib/utils";
import { canCreateProject, normalizeWorkspaceRole } from "@/lib/permissions";
import {
  fetchWorkspaceProjects,
  type ProjectSummary,
} from "@/lib/projects";
import type { WorkspaceRole } from "@/lib/workspaces";

type SidebarProjectsNavProps = {
  workspaceId: string;
  workspaceName: string;
  workspaceRole: WorkspaceRole;
  selectedProjectId: string | null;
  onSelectProject: (
    project: ProjectSummary,
    options?: { navigate?: boolean },
  ) => void;
};

export function SidebarProjectsNav({
  workspaceId,
  workspaceName,
  workspaceRole,
  selectedProjectId,
  onSelectProject,
}: SidebarProjectsNavProps) {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const role = normalizeWorkspaceRole(workspaceRole);

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await fetchWorkspaceProjects(workspaceId);
      setProjects(data);
      if (data.length === 0) {
        return;
      }

      if (selectedProjectId) {
        const matched = data.find((project) => project.id === selectedProjectId);
        if (matched) {
          onSelectProject(matched, { navigate: false });
          return;
        }
      }

      const storedId =
        typeof window !== "undefined"
          ? localStorage.getItem(SELECTED_PROJECT_KEY)
          : null;
      const selected = data.find((project) => project.id === storedId) ?? data[0];
      onSelectProject(selected, { navigate: false });
    } catch {
      setLoadError("Could not load projects.");
    } finally {
      setIsLoading(false);
    }
  }, [onSelectProject, selectedProjectId, workspaceId]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  function handleSelect(project: ProjectSummary) {
    localStorage.setItem(SELECTED_PROJECT_KEY, project.id);
    onSelectProject(project);
  }

  function handleCreated(project: ProjectSummary) {
    setProjects((current) => [project, ...current]);
    handleSelect(project);
  }

  return (
    <>
      <SidebarFlyoutSection
        title="Projects"
        action={
          canCreateProject(role) ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setCreateOpen(true);
              }}
              className="lane-add-btn"
              aria-label="Create project"
            >
              <Plus className="size-4" strokeWidth={2.5} />
            </button>
          ) : null
        }
      >
        {isLoading ? (
          <LoadingState inline label="Loading projects…" />
        ) : loadError ? (
          <p className="sidebar-flyout-meta text-[#bf2600]">{loadError}</p>
        ) : projects.length === 0 ? (
          <p className="sidebar-flyout-meta">No projects yet.</p>
        ) : (
          <ul className="sidebar-flyout-list">
            {projects.map((project) => (
              <li key={project.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(project)}
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

      {canCreateProject(role) ? (
        <CreateProjectDialog
          open={createOpen}
          workspaceId={workspaceId}
          workspaceName={workspaceName}
          onClose={() => setCreateOpen(false)}
          onCreated={handleCreated}
        />
      ) : null}
    </>
  );
}

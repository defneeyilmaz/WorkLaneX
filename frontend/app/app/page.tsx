"use client";

import { useCallback, useState } from "react";
import { MoreHorizontal, Search } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { DashboardView } from "@/components/dashboard-view";
import { DocsView } from "@/components/docs-view";
import { TaskBoard } from "@/components/task-board";
import { useAuth } from "@/components/auth-provider";
import { normalizeWorkspaceRole } from "@/lib/permissions";
import { fetchWorkspaceProjects, type ProjectSummary } from "@/lib/projects";
import type { WorkspaceSummary } from "@/lib/workspaces";

export type MainView = "dashboard" | "board" | "docs";

export default function AppPage() {
  const { user } = useAuth();
  const [selectedWorkspace, setSelectedWorkspace] =
    useState<WorkspaceSummary | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectSummary | null>(
    null,
  );
  const [mainView, setMainView] = useState<MainView>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");

  const workspaceRole = selectedWorkspace
    ? normalizeWorkspaceRole(selectedWorkspace.role)
    : null;

  const handleSelectWorkspace = useCallback((workspace: WorkspaceSummary) => {
    setSelectedWorkspace(workspace);
    setSelectedProject(null);
    setMainView("dashboard");
  }, []);

  const handleSelectProject = useCallback((project: ProjectSummary) => {
    setSelectedProject(project);
    setMainView("board");
  }, []);

  const handleOpenBoard = useCallback(
    async (projectId: string) => {
      if (!selectedWorkspace) {
        return;
      }

      try {
        const projects = await fetchWorkspaceProjects(selectedWorkspace.id);
        const project = projects.find((item) => item.id === projectId);
        if (project) {
          setSelectedProject(project);
          setMainView("board");
        }
      } catch {
        // Keep user on dashboard if project lookup fails.
      }
    },
    [selectedWorkspace],
  );

  const showBoard = mainView === "board" && selectedProject && selectedWorkspace;
  const showDashboard = mainView === "dashboard" && selectedWorkspace;
  const showDocs = mainView === "docs" && selectedProject && selectedWorkspace;

  const headerTitle =
    mainView === "dashboard"
      ? "Dashboard"
      : mainView === "docs"
        ? "Docs"
        : "Board";

  return (
    <div className="jira-shell app-layout">
      <AppSidebar
        selectedWorkspace={selectedWorkspace}
        selectedProjectId={selectedProject?.id ?? null}
        mainView={mainView}
        onSelectWorkspace={handleSelectWorkspace}
        onSelectProject={handleSelectProject}
        onShowDashboard={() => setMainView("dashboard")}
        onShowBoard={() => setMainView("board")}
        onShowDocs={() => setMainView("docs")}
      />

      <div className="jira-main">
        <header className="jira-board-header">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold text-[#1c1917]">{headerTitle}</h1>
            <div className="flex items-center gap-2">
              {(showBoard || showDocs) && selectedProject ? (
                <span className="jira-filter-btn cursor-default">
                  {selectedProject.name}
                </span>
              ) : null}
              <button type="button" className="jira-filter-btn" aria-label="More options">
                <MoreHorizontal className="size-4" />
              </button>
            </div>
          </div>

          {showBoard ? (
            <div className="jira-board-toolbar">
              <div className="relative min-w-[220px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#7a869a]" />
                <input
                  type="search"
                  className="jira-search pl-9"
                  placeholder="Search board"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button type="button" className="jira-filter-btn">
                Quick filters
              </button>
            </div>
          ) : null}
        </header>

        <div className="jira-board-body">
          {!selectedWorkspace ? (
            <div className="jira-empty">
              <p className="text-lg font-medium text-[#1c1917]">Select a workspace</p>
              <p className="mt-1.5 text-base text-[#78716c]">
                Choose a workspace from the sidebar to get started.
              </p>
            </div>
          ) : showDashboard && workspaceRole ? (
            <DashboardView
              workspaceId={selectedWorkspace.id}
              workspaceRole={workspaceRole}
              onOpenBoard={handleOpenBoard}
            />
          ) : showBoard && user && workspaceRole ? (
            <TaskBoard
              key={selectedProject.id}
              projectId={selectedProject.id}
              projectName={selectedProject.name}
              workspaceId={selectedWorkspace.id}
              workspaceRole={workspaceRole}
              userId={user.id}
              searchQuery={searchQuery}
            />
          ) : showDocs && user && workspaceRole ? (
            <DocsView
              key={selectedProject.id}
              projectId={selectedProject.id}
              projectName={selectedProject.name}
              workspaceRole={workspaceRole}
              userId={user.id}
            />
          ) : mainView === "board" || mainView === "docs" ? (
            <div className="jira-empty">
              <p className="text-lg font-medium text-[#1c1917]">Select a project</p>
              <p className="mt-1.5 text-base text-[#78716c]">
                Pick a project from the sidebar to open{" "}
                {mainView === "docs" ? "its docs" : "its board"}.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

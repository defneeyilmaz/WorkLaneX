"use client";

import { useCallback, useEffect, useState } from "react";
import { FolderKanban, LayoutGrid, Menu, Search } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { BoardQuickFilters } from "@/components/board-quick-filters";
import { EmptyState } from "@/components/empty-state";
import { DashboardView } from "@/components/dashboard-view";
import { DocsView } from "@/components/docs-view";
import { TaskBoard } from "@/components/task-board";
import { useAuth } from "@/components/auth-provider";
import { DEFAULT_BOARD_FILTERS, countActiveBoardFilters, type BoardFilters } from "@/lib/board-filters";
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
  const [boardFilters, setBoardFilters] = useState<BoardFilters>(DEFAULT_BOARD_FILTERS);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSearchQuery("");
    setBoardFilters(DEFAULT_BOARD_FILTERS);
  }, [selectedProject?.id]);

  useEffect(() => {
    if (!sidebarOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [sidebarOpen]);

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

  const hasActiveBoardQuery =
    searchQuery.trim().length > 0 || countActiveBoardFilters(boardFilters) > 0;

  const headerTitle =
    mainView === "dashboard"
      ? "Dashboard"
      : mainView === "docs"
        ? "Docs"
        : "Board";

  return (
    <div className="jira-shell app-layout">
      {sidebarOpen ? (
        <button
          type="button"
          className="jira-sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation"
        />
      ) : null}

      <AppSidebar
        selectedWorkspace={selectedWorkspace}
        selectedProjectId={selectedProject?.id ?? null}
        mainView={mainView}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
        onSelectWorkspace={handleSelectWorkspace}
        onSelectProject={handleSelectProject}
        onShowDashboard={() => setMainView("dashboard")}
        onShowBoard={() => setMainView("board")}
        onShowDocs={() => setMainView("docs")}
      />

      <div className="jira-main">
        <header className="jira-board-header">
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="jira-mobile-menu-btn"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open navigation"
              >
                <Menu className="size-5" />
              </button>
              <h1 className="jira-board-title">{headerTitle}</h1>
            </div>
            <div className="flex items-center gap-2">
              {(showBoard || showDocs) && selectedProject ? (
                <span className="jira-filter-btn cursor-default">
                  {selectedProject.name}
                </span>
              ) : null}
            </div>
          </div>

          {showBoard && user ? (
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
              <BoardQuickFilters
                workspaceId={selectedWorkspace!.id}
                userId={user.id}
                filters={boardFilters}
                onChange={setBoardFilters}
                onClearAll={() => setSearchQuery("")}
              />
            </div>
          ) : null}
        </header>

        <div className="jira-board-body">
          {!selectedWorkspace ? (
            <EmptyState
              icon={LayoutGrid}
              title="Select a workspace"
              description="Choose a workspace from the sidebar to open the dashboard, board, or docs."
            />
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
              boardFilters={boardFilters}
              hasActiveQuery={hasActiveBoardQuery}
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
            <EmptyState
              icon={FolderKanban}
              title="Select a project"
              description={`Pick a project from the sidebar to open ${
                mainView === "docs" ? "its docs" : "its board"
              }.`}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

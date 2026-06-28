"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FolderKanban, LayoutGrid, Menu, Search } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { BoardQuickFilters } from "@/components/board-quick-filters";
import { EmptyState } from "@/components/empty-state";
import { DashboardView } from "@/components/dashboard-view";
import { DocsView } from "@/components/docs-view";
import { DiscussionView } from "@/components/discussion-view";
import { LoadingState } from "@/components/loading-state";
import { MeetingsView } from "@/components/meetings-view";
import { TaskBoard } from "@/components/task-board";
import { useAuth } from "@/components/auth-provider";
import {
  appPathFor,
  isProjectAppPath,
  isProjectScopedView,
  parseAppPath,
  SELECTED_PROJECT_KEY,
  type MainView,
} from "@/lib/app-navigation";
import { DEFAULT_BOARD_FILTERS, countActiveBoardFilters, type BoardFilters } from "@/lib/board-filters";
import { normalizeWorkspaceRole } from "@/lib/permissions";
import { fetchWorkspaceProjects, type ProjectSummary } from "@/lib/projects";
import type { WorkspaceSummary } from "@/lib/workspaces";

function isRecognizedAppPath(pathname: string): boolean {
  const normalized = pathname.replace(/\/$/, "") || "/app";
  return (
    normalized === "/app" ||
    normalized === "/app/board" ||
    normalized === "/app/docs" ||
    normalized === "/app/meetings" ||
    normalized === "/app/discussion" ||
    isProjectAppPath(normalized)
  );
}

export function AppShell() {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { view: mainView, projectId: routeProjectId } = parseAppPath(pathname);

  const [selectedWorkspace, setSelectedWorkspace] =
    useState<WorkspaceSummary | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [boardFilters, setBoardFilters] = useState<BoardFilters>(DEFAULT_BOARD_FILTERS);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (isRecognizedAppPath(pathname)) {
      return;
    }
    router.replace("/app");
  }, [pathname, router]);

  useEffect(() => {
    setSearchQuery("");
    setBoardFilters(DEFAULT_BOARD_FILTERS);
  }, [routeProjectId, mainView]);

  useEffect(() => {
    const workspaceId = selectedWorkspace?.id;
    if (!routeProjectId || !workspaceId) {
      return;
    }

    let cancelled = false;

    async function resolveProjectFromRoute() {
      try {
        const projects = await fetchWorkspaceProjects(workspaceId);
        if (cancelled) {
          return;
        }

        const project = projects.find((item) => item.id === routeProjectId);
        if (project) {
          setSelectedProject((current) =>
            current?.id === project.id ? current : project,
          );
          localStorage.setItem(SELECTED_PROJECT_KEY, project.id);
          return;
        }

        setSelectedProject(null);
        router.replace(appPathFor(mainView));
      } catch {
        if (!cancelled) {
          router.replace("/app");
        }
      }
    }

    void resolveProjectFromRoute();

    return () => {
      cancelled = true;
    };
  }, [mainView, routeProjectId, router, selectedWorkspace?.id]);

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

  const handleSelectWorkspace = useCallback(
    (workspace: WorkspaceSummary, options?: { navigate?: boolean }) => {
      const changed = selectedWorkspace?.id !== workspace.id;
      if (!changed) {
        return;
      }
      setSelectedWorkspace(workspace);
      setSelectedProject(null);
      if (options?.navigate !== false) {
        router.push("/app");
      }
    },
    [router, selectedWorkspace?.id],
  );

  const handleSelectProject = useCallback(
    (project: ProjectSummary, options?: { navigate?: boolean }) => {
      setSelectedProject((current) =>
        current?.id === project.id ? current : project,
      );
      localStorage.setItem(SELECTED_PROJECT_KEY, project.id);
      if (options?.navigate !== false) {
        const targetView = isProjectScopedView(mainView) ? mainView : "board";
        router.push(appPathFor(targetView, project.id));
      }
    },
    [mainView, router],
  );

  const navigateToView = useCallback(
    (view: MainView) => {
      if (view === "dashboard") {
        router.push("/app");
        return;
      }

      if (selectedProject) {
        router.push(appPathFor(view, selectedProject.id));
        return;
      }

      router.push(appPathFor(view));
    },
    [router, selectedProject],
  );

  const handleOpenBoard = useCallback(
    (projectId: string) => {
      router.push(appPathFor("board", projectId));
    },
    [router],
  );

  const showBoard =
    mainView === "board" && routeProjectId && selectedProject && selectedWorkspace;
  const showDashboard = mainView === "dashboard" && selectedWorkspace;
  const showDocs =
    mainView === "docs" && routeProjectId && selectedProject && selectedWorkspace;
  const showMeetings =
    mainView === "meetings" && routeProjectId && selectedProject && selectedWorkspace;
  const showDiscussion =
    mainView === "discussion" && routeProjectId && selectedProject && selectedWorkspace;

  const hasActiveBoardQuery =
    searchQuery.trim().length > 0 || countActiveBoardFilters(boardFilters) > 0;

  const headerTitle =
    mainView === "dashboard"
      ? "Dashboard"
      : mainView === "docs"
        ? "Docs"
        : mainView === "meetings"
          ? "Meetings"
          : mainView === "discussion"
            ? "Discussion"
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
        selectedProjectId={selectedProject?.id ?? routeProjectId}
        mainView={mainView}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
        onSelectWorkspace={handleSelectWorkspace}
        onSelectProject={handleSelectProject}
        onShowDashboard={() => navigateToView("dashboard")}
        onShowBoard={() => navigateToView("board")}
        onShowDocs={() => navigateToView("docs")}
        onShowMeetings={() => navigateToView("meetings")}
        onShowDiscussion={() => navigateToView("discussion")}
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
              {(showBoard || showDocs || showMeetings || showDiscussion) && selectedProject ? (
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
          ) : showMeetings && user && workspaceRole ? (
            <MeetingsView
              key={selectedProject.id}
              projectId={selectedProject.id}
              projectName={selectedProject.name}
              workspaceRole={workspaceRole}
              userId={user.id}
            />
          ) : showDiscussion && user ? (
            <DiscussionView
              key={selectedProject.id}
              projectId={selectedProject.id}
              projectName={selectedProject.name}
              userId={user.id}
            />
          ) : routeProjectId && !selectedProject && selectedWorkspace ? (
            <LoadingState label="Loading project…" />
          ) : isProjectScopedView(mainView) ? (
            <EmptyState
              icon={FolderKanban}
              title="Select a project"
              description={`Pick a project from the sidebar to open ${
                mainView === "docs"
                  ? "its docs"
                  : mainView === "meetings"
                    ? "its meeting notes"
                    : mainView === "discussion"
                      ? "its discussion"
                      : "its board"
              }.`}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

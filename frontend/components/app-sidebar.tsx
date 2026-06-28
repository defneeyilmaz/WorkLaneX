"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { FileText, LayoutDashboard, LayoutGrid, MessageSquare, NotebookPen, Rocket, X } from "lucide-react";

import type { MainView } from "@/lib/app-navigation";
import { useAuth } from "@/components/auth-provider";
import { MemberProjectSidebar } from "@/components/member-project-sidebar";
import { SidebarProjectsNav } from "@/components/sidebar-projects-nav";
import { WorkspaceMembersPanel } from "@/components/workspace-members-panel";
import { WorkspacePanel } from "@/components/workspace-panel";
import { Button } from "@/components/ui/button";
import { normalizeWorkspaceRole } from "@/lib/permissions";
import type { ProjectSummary } from "@/lib/projects";
import { formatWorkspaceRole, type WorkspaceSummary } from "@/lib/workspaces";
import { getInitials } from "@/lib/user-display";
import { cn } from "@/lib/utils";

type AppSidebarProps = {
  selectedWorkspace: WorkspaceSummary | null;
  selectedProjectId: string | null;
  mainView: MainView;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  onSelectWorkspace: (
    workspace: WorkspaceSummary,
    options?: { navigate?: boolean },
  ) => void;
  onSelectProject: (
    project: ProjectSummary,
    options?: { navigate?: boolean },
  ) => void;
  onShowDashboard: () => void;
  onShowBoard: () => void;
  onShowDocs: () => void;
  onShowMeetings: () => void;
  onShowDiscussion: () => void;
};

function NavButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("jira-nav-item", active && "jira-nav-item-active")}
      aria-current={active ? "page" : undefined}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export function AppSidebar({
  selectedWorkspace,
  selectedProjectId,
  mainView,
  mobileOpen = false,
  onMobileClose,
  onSelectWorkspace,
  onSelectProject,
  onShowDashboard,
  onShowBoard,
  onShowDocs,
  onShowMeetings,
  onShowDiscussion,
}: AppSidebarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const workspaceRole = selectedWorkspace
    ? normalizeWorkspaceRole(selectedWorkspace.role)
    : null;
  const isMember = workspaceRole === "Member";

  const closeMobileNav = useCallback(() => {
    onMobileClose?.();
  }, [onMobileClose]);

  const handleSelectWorkspace = useCallback(
    (workspace: WorkspaceSummary) => {
      onSelectWorkspace(workspace);
      closeMobileNav();
    },
    [closeMobileNav, onSelectWorkspace],
  );

  const handleSelectProject = useCallback(
    (project: ProjectSummary) => {
      onSelectProject(project);
      closeMobileNav();
    },
    [closeMobileNav, onSelectProject],
  );

  const handleShowDashboard = useCallback(() => {
    onShowDashboard();
    closeMobileNav();
  }, [closeMobileNav, onShowDashboard]);

  const handleShowBoard = useCallback(() => {
    onShowBoard();
    closeMobileNav();
  }, [closeMobileNav, onShowBoard]);

  const handleShowDocs = useCallback(() => {
    onShowDocs();
    closeMobileNav();
  }, [closeMobileNav, onShowDocs]);

  const handleShowMeetings = useCallback(() => {
    onShowMeetings();
    closeMobileNav();
  }, [closeMobileNav, onShowMeetings]);

  const handleShowDiscussion = useCallback(() => {
    onShowDiscussion();
    closeMobileNav();
  }, [closeMobileNav, onShowDiscussion]);

  function handleLogout() {
    logout();
    router.push("/");
  }

  const workspaceSubtitle = selectedWorkspace
    ? selectedWorkspace.description?.trim() ||
      `${formatWorkspaceRole(selectedWorkspace.role)} workspace`
    : null;

  return (
    <aside className={cn("jira-sidebar", mobileOpen && "jira-sidebar-open")}>
      <div className="jira-sidebar-top">
        <Link href="/" className="jira-sidebar-logo" onClick={closeMobileNav}>
          WorkLaneX
        </Link>
        {onMobileClose ? (
          <button
            type="button"
            className="jira-sidebar-close"
            onClick={closeMobileNav}
            aria-label="Close navigation"
          >
            <X className="size-5" />
          </button>
        ) : null}
      </div>

      {selectedWorkspace ? (
        <div className="jira-project-block">
          <div className="jira-project-icon">
            <Rocket className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{selectedWorkspace.name}</p>
            <p className="truncate text-base text-white/70">{workspaceSubtitle}</p>
          </div>
        </div>
      ) : null}

      <div className="jira-sidebar-scroll">
        <WorkspacePanel
          selectedWorkspaceId={selectedWorkspace?.id ?? null}
          onSelectWorkspace={handleSelectWorkspace}
        />

        {selectedWorkspace && workspaceRole && !isMember ? (
          <>
            <div className="space-y-1 px-2 pt-2">
              <NavButton
                active={mainView === "dashboard"}
                onClick={handleShowDashboard}
                icon={<LayoutDashboard className="shrink-0" />}
                label="Dashboard"
              />
              <NavButton
                active={mainView === "board"}
                onClick={handleShowBoard}
                icon={<LayoutGrid className="shrink-0" />}
                label="Board"
              />
              <NavButton
                active={mainView === "docs"}
                onClick={handleShowDocs}
                icon={<FileText className="shrink-0" />}
                label="Docs"
              />
              <NavButton
                active={mainView === "meetings"}
                onClick={handleShowMeetings}
                icon={<NotebookPen className="shrink-0" />}
                label="Meetings"
              />
              <NavButton
                active={mainView === "discussion"}
                onClick={handleShowDiscussion}
                icon={<MessageSquare className="shrink-0" />}
                label="Discussion"
              />
            </div>
            <SidebarProjectsNav
              workspaceId={selectedWorkspace.id}
              workspaceName={selectedWorkspace.name}
              workspaceRole={workspaceRole}
              selectedProjectId={selectedProjectId}
              onSelectProject={handleSelectProject}
            />
            <WorkspaceMembersPanel
              workspaceId={selectedWorkspace.id}
              actorRole={workspaceRole}
            />
          </>
        ) : null}

        {isMember ? (
          <MemberProjectSidebar
            selectedWorkspaceId={selectedWorkspace?.id ?? null}
            selectedProjectId={selectedProjectId}
            mainView={mainView}
            onSelectWorkspace={handleSelectWorkspace}
            onSelectProject={handleSelectProject}
            onShowDashboard={handleShowDashboard}
            onShowBoard={handleShowBoard}
            onShowDocs={handleShowDocs}
            onShowMeetings={handleShowMeetings}
            onShowDiscussion={handleShowDiscussion}
          />
        ) : null}
      </div>

      <div className="jira-sidebar-footer">
        {user ? (
          <div className="jira-user-row">
            <div className="jira-avatar">{getInitials(user.fullName)}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-medium">{user.fullName}</p>
              <p className="truncate text-base text-white/70">{user.email}</p>
            </div>
          </div>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="mt-3 w-full border-white/25 bg-transparent text-lg text-white hover:bg-white/12 hover:text-white"
          onClick={handleLogout}
        >
          Log out
        </Button>
      </div>
    </aside>
  );
}

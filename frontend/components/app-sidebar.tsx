"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutGrid, Rocket } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { MemberProjectSidebar } from "@/components/member-project-sidebar";
import { SidebarProjectsNav } from "@/components/sidebar-projects-nav";
import { WorkspaceMembersPanel } from "@/components/workspace-members-panel";
import { WorkspacePanel } from "@/components/workspace-panel";
import { Button } from "@/components/ui/button";
import { normalizeWorkspaceRole } from "@/lib/permissions";
import type { ProjectSummary } from "@/lib/projects";
import type { WorkspaceSummary } from "@/lib/workspaces";

type AppSidebarProps = {
  selectedWorkspace: WorkspaceSummary | null;
  selectedProjectId: string | null;
  onSelectWorkspace: (workspace: WorkspaceSummary) => void;
  onSelectProject: (project: ProjectSummary) => void;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function AppSidebar({
  selectedWorkspace,
  selectedProjectId,
  onSelectWorkspace,
  onSelectProject,
}: AppSidebarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const workspaceRole = selectedWorkspace
    ? normalizeWorkspaceRole(selectedWorkspace.role)
    : null;
  const isMember = workspaceRole === "Member";

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <aside className="jira-sidebar">
      <div className="jira-sidebar-top">
        <Link href="/" className="jira-sidebar-logo">
          WorkLaneX
        </Link>
      </div>

      {selectedWorkspace ? (
        <div className="jira-project-block">
          <div className="jira-project-icon">
            <Rocket className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{selectedWorkspace.name}</p>
            <p className="truncate text-base text-white/70">
              {workspaceRole ?? "Workspace"} · Software project
            </p>
          </div>
        </div>
      ) : null}

      <div className="jira-sidebar-scroll">
        <WorkspacePanel
          selectedWorkspaceId={selectedWorkspace?.id ?? null}
          onSelectWorkspace={onSelectWorkspace}
        />

        {selectedWorkspace && workspaceRole && !isMember ? (
          <>
            <SidebarProjectsNav
              workspaceId={selectedWorkspace.id}
              workspaceName={selectedWorkspace.name}
              workspaceRole={workspaceRole}
              selectedProjectId={selectedProjectId}
              onSelectProject={onSelectProject}
            />
            <div className="px-2 pt-2">
              <div className="jira-nav-item jira-nav-item-active pointer-events-none">
                <LayoutGrid className="shrink-0" />
                <span>Board</span>
              </div>
            </div>
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
            onSelectWorkspace={onSelectWorkspace}
            onSelectProject={onSelectProject}
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

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { ProjectPanel } from "@/components/project-panel";
import { TaskBoard } from "@/components/task-board";
import { WorkspacePanel } from "@/components/workspace-panel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ProjectSummary } from "@/lib/projects";
import type { WorkspaceSummary } from "@/lib/workspaces";

export default function AppPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [selectedWorkspace, setSelectedWorkspace] =
    useState<WorkspaceSummary | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectSummary | null>(
    null,
  );

  function handleLogout() {
    logout();
    router.push("/");
  }

  const handleSelectWorkspace = useCallback((workspace: WorkspaceSummary) => {
    setSelectedWorkspace(workspace);
    setSelectedProject(null);
  }, []);

  const boardStep = selectedProject
    ? "tasks"
    : selectedWorkspace
      ? "project"
      : "workspace";

  return (
    <div className="app-modern-shell flex min-h-full flex-col">
      <header className="glass-header sticky top-0 z-10 flex items-center justify-between px-6 py-4 md:px-8">
        <Link
          href="/"
          className="text-xl font-semibold tracking-tight transition-opacity hover:opacity-80"
        >
          WorkLaneX
        </Link>
        <Button type="button" variant="outline" onClick={handleLogout}>
          Log out
        </Button>
      </header>

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 py-8 md:px-8 md:py-10">
        <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <Card className="glass-card border-none py-5">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold">
                  Signed in as {user?.fullName}
                </CardTitle>
                <CardDescription className="text-base">
                  {user?.email}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-base text-muted-foreground">
                Select a workspace on the left, then manage projects and tasks
                in the board area.
              </CardContent>
            </Card>

            <WorkspacePanel
              selectedWorkspaceId={selectedWorkspace?.id ?? null}
              onSelectWorkspace={handleSelectWorkspace}
            />
          </aside>

          <section className="space-y-6">
            <Card className="glass-card border-none py-5">
              <CardHeader className="gap-4 md:flex md:flex-row md:items-end md:justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-semibold md:text-3xl">
                    Board
                  </CardTitle>
                  <CardDescription className="text-base">
                    {selectedProject
                      ? `Working in ${selectedProject.name}`
                      : selectedWorkspace
                        ? `Workspace: ${selectedWorkspace.name}`
                        : "Workspace, project, and task flow in one screen."}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { id: "workspace", label: "Workspace" },
                      { id: "project", label: "Project" },
                      { id: "tasks", label: "Tasks" },
                    ] as const
                  ).map((chip) => (
                    <span
                      key={chip.id}
                      className={cn(
                        "board-chip",
                        boardStep === chip.id && "board-chip-active",
                      )}
                    >
                      {chip.label}
                    </span>
                  ))}
                </div>
              </CardHeader>
            </Card>

            {selectedWorkspace ? (
              <ProjectPanel
                key={selectedWorkspace.id}
                workspaceId={selectedWorkspace.id}
                workspaceName={selectedWorkspace.name}
                selectedProjectId={selectedProject?.id ?? null}
                onSelectProject={setSelectedProject}
              />
            ) : (
              <Card className="glass-card border-none py-5">
                <CardHeader>
                  <CardTitle className="text-xl">Select a workspace</CardTitle>
                  <CardDescription className="text-base">
                    Choose a workspace to view and create projects.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            {selectedProject ? (
              <TaskBoard
                key={selectedProject.id}
                projectId={selectedProject.id}
                projectName={selectedProject.name}
              />
            ) : (
              <Card className="glass-card border-none py-5">
                <CardHeader>
                  <CardTitle className="text-xl">Select a project</CardTitle>
                  <CardDescription className="text-base">
                    Pick a project to open its task board.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

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
import type { ProjectSummary } from "@/lib/projects";
import type { WorkspaceSummary } from "@/lib/workspaces";

export default function AppPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [selectedWorkspace, setSelectedWorkspace] =
    useState<WorkspaceSummary | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectSummary | null>(null);

  function handleLogout() {
    logout();
    router.push("/");
  }

  const handleSelectWorkspace = useCallback((workspace: WorkspaceSummary) => {
    setSelectedWorkspace(workspace);
    setSelectedProject(null);
  }, []);

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-5">
        <Link
          href="/"
          className="text-xl font-semibold tracking-tight hover:opacity-80"
        >
          WorkLaneX
        </Link>
        <Button type="button" variant="outline" onClick={handleLogout}>
          Log out
        </Button>
      </header>

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 py-8 md:py-10">
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <Card className="border-primary/20 bg-gradient-to-b from-primary/10 to-background shadow-sm">
              <CardHeader>
                <CardTitle className="text-2xl">Signed in as {user?.fullName}</CardTitle>
                <CardDescription>{user?.email}</CardDescription>
              </CardHeader>
              <CardContent className="text-lg text-muted-foreground">
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
            <Card className="shadow-sm">
              <CardHeader className="gap-4 md:flex md:flex-row md:items-end md:justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-2xl md:text-3xl">Board</CardTitle>
                  <CardDescription>
                    Workspace, project, and task flow in one screen.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <span className="rounded-full border border-border bg-muted px-3 py-1">
                    Workspace
                  </span>
                  <span className="rounded-full border border-border bg-muted px-3 py-1">
                    Project
                  </span>
                  <span className="rounded-full border border-border bg-muted px-3 py-1">
                    Tasks
                  </span>
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
              <Card>
                <CardHeader>
                  <CardTitle>Select a workspace</CardTitle>
                  <CardDescription>
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
              <Card>
                <CardHeader>
                  <CardTitle>Select a project</CardTitle>
                  <CardDescription>
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

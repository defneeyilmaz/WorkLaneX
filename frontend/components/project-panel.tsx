"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createProject,
  fetchWorkspaceProjects,
  getProjectErrorMessage,
  type ProjectSummary,
} from "@/lib/projects";
import { cn } from "@/lib/utils";
import { canCreateProject, normalizeWorkspaceRole } from "@/lib/permissions";
import type { WorkspaceRole } from "@/lib/workspaces";

type ProjectPanelProps = {
  workspaceId: string;
  workspaceName: string;
  workspaceRole: WorkspaceRole;
  selectedProjectId: string | null;
  onSelectProject: (project: ProjectSummary) => void;
};

const SELECTED_PROJECT_KEY = "worklanex_selected_project_id";

export function ProjectPanel({
  workspaceId,
  workspaceName,
  workspaceRole,
  selectedProjectId,
  onSelectProject,
}: ProjectPanelProps) {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const role = normalizeWorkspaceRole(workspaceRole);
  const showCreateForm = canCreateProject(role);

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchWorkspaceProjects(workspaceId);
      setProjects(data);
      if (data.length > 0) {
        const storedId =
          typeof window !== "undefined"
            ? localStorage.getItem(SELECTED_PROJECT_KEY)
            : null;
        const selected = data.find((project) => project.id === storedId) ?? data[0];
        onSelectProject(selected);
      }
    } catch {
      setError("Could not load projects.");
    } finally {
      setIsLoading(false);
    }
  }, [onSelectProject, workspaceId]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const created = await createProject(workspaceId, name.trim(), description);
      setProjects((current) => [created, ...current]);
      localStorage.setItem(SELECTED_PROJECT_KEY, created.id);
      onSelectProject(created);
      setName("");
      setDescription("");
    } catch (err) {
      setError(getProjectErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSelect(project: ProjectSummary) {
    localStorage.setItem(SELECTED_PROJECT_KEY, project.id);
    onSelectProject(project);
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card border-none py-5 text-base">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            Projects in {workspaceName}
          </CardTitle>
          <CardDescription className="text-base">
            Pick a project to open its kanban board.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-base text-muted-foreground">Loading projects…</p>
          ) : projects.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/70 bg-white/40 px-4 py-6 text-center text-base text-muted-foreground">
              No projects yet. Create one below.
            </p>
          ) : (
            <ul className="space-y-3">
              {projects.map((project) => (
                <li key={project.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(project)}
                    className={cn(
                      "selectable-item",
                      project.id === selectedProjectId && "selectable-item-active",
                    )}
                  >
                    <p className="text-lg font-medium">{project.name}</p>
                    {project.description ? (
                      <p className="mt-1 text-base text-muted-foreground">
                        {project.description}
                      </p>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {showCreateForm ? (
      <Card className="glass-card border-none py-5 text-base">
        <CardHeader>
          <CardTitle className="text-2xl">New project</CardTitle>
          <CardDescription>
            Add a project to organize work inside this workspace.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleCreate}>
          <CardContent className="space-y-4 pb-4">
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="project-name">Name</Label>
              <Input
                id="project-name"
                className="h-11 text-base"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="MVP launch"
                required
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-description">Description (optional)</Label>
              <Input
                id="project-description"
                className="h-11 text-base"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What this project delivers"
                maxLength={1000}
              />
            </div>
          </CardContent>
          <div className="flex items-center rounded-b-2xl border-t border-white/50 bg-white/40 p-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create project"}
            </Button>
          </div>
        </form>
      </Card>
      ) : null}
    </div>
  );
}

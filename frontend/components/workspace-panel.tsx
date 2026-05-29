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
import { cn } from "@/lib/utils";
import {
  createWorkspace,
  fetchMyWorkspaces,
  formatWorkspaceRole,
  getWorkspaceErrorMessage,
  type WorkspaceSummary,
} from "@/lib/workspaces";

const SELECTED_WORKSPACE_KEY = "worklanex_selected_workspace_id";

type WorkspacePanelProps = {
  selectedWorkspaceId: string | null;
  onSelectWorkspace: (workspace: WorkspaceSummary) => void;
};

export function WorkspacePanel({
  selectedWorkspaceId,
  onSelectWorkspace,
}: WorkspacePanelProps) {
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadWorkspaces = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchMyWorkspaces();
      setWorkspaces(data);

      if (data.length === 0) {
        return;
      }

      const storedId =
        typeof window !== "undefined"
          ? localStorage.getItem(SELECTED_WORKSPACE_KEY)
          : null;
      const stored = storedId
        ? data.find((workspace) => workspace.id === storedId)
        : undefined;
      const selected = stored ?? data[0];
      onSelectWorkspace(selected);
    } catch {
      setError("Could not load workspaces.");
    } finally {
      setIsLoading(false);
    }
  }, [onSelectWorkspace]);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  function handleSelect(workspace: WorkspaceSummary) {
    localStorage.setItem(SELECTED_WORKSPACE_KEY, workspace.id);
    onSelectWorkspace(workspace);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const created = await createWorkspace(name.trim(), description);
      setWorkspaces((current) => [created, ...current]);
      handleSelect(created);
      setName("");
      setDescription("");
    } catch (err) {
      setError(getWorkspaceErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card border-none py-5 text-base">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Your workspaces</CardTitle>
          <CardDescription className="text-base">
            Select a workspace to view and manage its projects.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-base text-muted-foreground">Loading workspaces…</p>
          ) : workspaces.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/70 bg-white/40 px-4 py-6 text-center text-base text-muted-foreground">
              No workspaces yet. Create one below.
            </p>
          ) : (
            <ul className="space-y-3">
              {workspaces.map((workspace) => {
                const isSelected = workspace.id === selectedWorkspaceId;
                return (
                  <li key={workspace.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(workspace)}
                      className={cn(
                        "selectable-item",
                        isSelected && "selectable-item-active",
                      )}
                    >
                      <p className="text-lg font-medium">{workspace.name}</p>
                      {workspace.description ? (
                        <p className="mt-1 text-base text-muted-foreground">
                          {workspace.description}
                        </p>
                      ) : null}
                      <p className="mt-2 text-sm font-medium text-muted-foreground">
                        {formatWorkspaceRole(workspace.role)}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card border-none py-5 text-base">
        <CardHeader>
          <CardTitle className="text-2xl">Create workspace</CardTitle>
          <CardDescription>
            Add another workspace for a team or side project.
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
              <Label htmlFor="workspace-name">Name</Label>
              <Input
                id="workspace-name"
                className="h-11 text-base"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Product team"
                required
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workspace-description">
                Description (optional)
              </Label>
              <Input
                id="workspace-description"
                className="h-11 text-base"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What this workspace is for"
                maxLength={1000}
              />
            </div>
          </CardContent>
          <div className="flex items-center rounded-b-2xl border-t border-white/50 bg-white/40 p-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create workspace"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

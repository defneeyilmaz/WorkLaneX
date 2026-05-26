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
  createWorkspace,
  fetchMyWorkspaces,
  formatWorkspaceRole,
  getWorkspaceErrorMessage,
  type WorkspaceSummary,
} from "@/lib/workspaces";

export function WorkspacePanel() {
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
    } catch {
      setError("Could not load workspaces.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const created = await createWorkspace(name.trim(), description);
      setWorkspaces((current) => [created, ...current]);
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
      <Card>
        <CardHeader>
          <CardTitle>Your workspaces</CardTitle>
          <CardDescription>
            Teams and projects live inside a workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading workspaces…</p>
          ) : workspaces.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No workspaces yet. Create one below.
            </p>
          ) : (
            <ul className="space-y-3">
              {workspaces.map((workspace) => (
                <li
                  key={workspace.id}
                  className="rounded-lg border border-border px-4 py-3"
                >
                  <p className="font-medium">{workspace.name}</p>
                  {workspace.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {workspace.description}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatWorkspaceRole(workspace.role)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create workspace</CardTitle>
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
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What this workspace is for"
                maxLength={1000}
              />
            </div>
          </CardContent>
          <div className="flex items-center rounded-b-xl border-t bg-muted/50 p-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create workspace"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

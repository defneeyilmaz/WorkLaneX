"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { ProjectPanel } from "@/components/project-panel";
import { WorkspacePanel } from "@/components/workspace-panel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { WorkspaceSummary } from "@/lib/workspaces";

export default function AppPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [selectedWorkspace, setSelectedWorkspace] =
    useState<WorkspaceSummary | null>(null);

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight hover:opacity-80"
        >
          WorkLaneX
        </Link>
        <Button type="button" variant="outline" onClick={handleLogout}>
          Log out
        </Button>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-6 py-16">
        <Card>
          <CardHeader>
            <CardTitle>Signed in as {user?.fullName}</CardTitle>
            <CardDescription>{user?.email}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Pick a workspace, then create projects inside it.
          </CardContent>
        </Card>

        <WorkspacePanel
          selectedWorkspaceId={selectedWorkspace?.id ?? null}
          onSelectWorkspace={setSelectedWorkspace}
        />

        {selectedWorkspace ? (
          <ProjectPanel
            key={selectedWorkspace.id}
            workspaceId={selectedWorkspace.id}
            workspaceName={selectedWorkspace.name}
          />
        ) : null}
      </main>
    </div>
  );
}

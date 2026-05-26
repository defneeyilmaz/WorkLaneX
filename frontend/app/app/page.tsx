"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth-provider";
import { WorkspacePanel } from "@/components/workspace-panel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AppPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

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
            Manage your workspaces below. New accounts get a default workspace
            on registration.
          </CardContent>
        </Card>

        <WorkspacePanel />
      </main>
    </div>
  );
}

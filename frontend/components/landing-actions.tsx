"use client";

import Link from "next/link";

import { useAuth } from "@/components/auth-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingActions() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Button disabled size="sm" variant="outline">
        Loading…
      </Button>
    );
  }

  if (isAuthenticated) {
    return (
      <Link href="/app" className={cn(buttonVariants({ size: "sm" }))}>
        Open workspace
      </Link>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href="/login" className={cn(buttonVariants({ size: "sm" }))}>
        Log in
      </Link>
      <Link
        href="/register"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
      >
        Create account
      </Link>
    </div>
  );
}

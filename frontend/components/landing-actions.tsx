"use client";

import Link from "next/link";

import { useAuth } from "@/components/auth-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingActions() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Button disabled variant="outline">
        Loading…
      </Button>
    );
  }

  if (isAuthenticated) {
    return (
      <Link href="/app" className={cn(buttonVariants())}>
        Open workspace
      </Link>
    );
  }

  return (
    <>
      <Link href="/login" className={cn(buttonVariants())}>
        Log in
      </Link>
      <Link href="/register" className={cn(buttonVariants({ variant: "outline" }))}>
        Create account
      </Link>
    </>
  );
}

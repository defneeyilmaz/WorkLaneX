"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/components/auth-provider";
import { LoadingState } from "@/components/loading-state";

export function GuestOnly({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/app");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="app-session-shell">
        <LoadingState label="Checking your session…" />
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return children;
}

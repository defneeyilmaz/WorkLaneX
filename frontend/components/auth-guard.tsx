"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/components/auth-provider";
import { LoadingState } from "@/components/loading-state";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="app-session-shell">
        <LoadingState label="Loading your workspace…" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="app-session-shell">
        <p className="text-sm text-[#78716c]">
          Redirecting to sign in…{" "}
          <Link href="/login" className="font-medium text-[#ea580c] underline">
            Log in
          </Link>
        </p>
      </div>
    );
  }

  return children;
}

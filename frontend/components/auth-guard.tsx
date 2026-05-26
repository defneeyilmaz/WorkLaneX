"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/components/auth-provider";

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
      <p className="px-6 py-16 text-sm text-muted-foreground">
        Loading your workspace…
      </p>
    );
  }

  if (!isAuthenticated) {
    return (
      <p className="px-6 py-16 text-sm text-muted-foreground">
        Redirecting to sign in…{" "}
        <Link href="/login" className="underline">
          Log in
        </Link>
      </p>
    );
  }

  return children;
}

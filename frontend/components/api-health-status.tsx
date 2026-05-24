"use client";

import { useEffect, useState } from "react";

import { fetchHealth, type HealthResponse } from "@/lib/health";

export function ApiHealthStatus() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchHealth()
      .then((data) => {
        if (!cancelled) {
          setHealth(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Cannot reach the API. Is the backend running?");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <p className="text-xs text-muted-foreground">Checking API connection…</p>
    );
  }

  if (error) {
    return <p className="text-xs text-destructive">{error}</p>;
  }

  if (!health) {
    return null;
  }

  const isHealthy = health.status === "healthy";

  return (
    <p
      className={`text-xs ${isHealthy ? "text-muted-foreground" : "text-amber-700 dark:text-amber-500"}`}
    >
      API {health.status} · database {health.database}
    </p>
  );
}

import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type LoadingStateProps = {
  label?: string;
  className?: string;
  inline?: boolean;
};

export function LoadingState({
  label = "Loading…",
  className,
  inline = false,
}: LoadingStateProps) {
  return (
    <div
      className={cn(inline ? "loading-state-inline" : "loading-state", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="loading-state-icon" aria-hidden="true" />
      <p className="loading-state-label">{label}</p>
    </div>
  );
}

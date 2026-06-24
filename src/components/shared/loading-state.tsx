import { Loader2 } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type LoadingVariant = "spinner" | "skeleton-grid" | "skeleton-list" | "skeleton-table";

export interface LoadingStateProps {
  variant?: LoadingVariant;
  className?: string;
  /** Number of skeleton items to render (grid/list/table). */
  count?: number;
  /** Optional ARIA label, defaults to "Loading…". */
  label?: string;
  /** Render a smaller footprint. */
  size?: "default" | "sm";
}

/**
 * Unified loading state.
 *
 * Replaces ad-hoc `Loader2` blocks (saved, seller, profile redirect), one-off
 * `Skeleton` grids (portfolio, honey, watchlist), and bare `<p>Loading…</p>`
 * strings sprinkled through the app.
 *
 * Variants:
 *  - `spinner`        — small centered spinner, padded panel-friendly block.
 *  - `skeleton-grid`  — responsive grid of card placeholders.
 *  - `skeleton-list`  — vertical stack of row placeholders.
 *  - `skeleton-table` — table-shaped placeholder (header + N rows).
 */
export function LoadingState({
  variant = "spinner",
  className,
  count = 6,
  label = "Loading…",
  size = "default",
}: LoadingStateProps) {
  if (variant === "skeleton-grid") {
    return (
      <div
        role="status"
        aria-label={label}
        className={cn(
          "grid gap-4",
          "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
          className,
        )}
      >
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} className={cn(size === "sm" ? "h-32" : "h-44")} />
        ))}
      </div>
    );
  }

  if (variant === "skeleton-list") {
    return (
      <div role="status" aria-label={label} className={cn("space-y-2", className)}>
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} className={cn(size === "sm" ? "h-12" : "h-16")} />
        ))}
      </div>
    );
  }

  if (variant === "skeleton-table") {
    return (
      <div role="status" aria-label={label} className={cn("panel overflow-hidden", className)}>
        <div className="border-b border-[var(--p-hair)] bg-muted/40 px-4 py-3">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="divide-y divide-[var(--p-hair)]">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="size-10 shrink-0 rounded-md" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-2.5 w-20" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-label={label}
      className={cn(
        "flex items-center justify-center gap-2 text-muted-foreground",
        size === "sm" ? "py-6" : "py-12",
        className,
      )}
    >
      <Loader2
        className={cn("animate-spin", size === "sm" ? "size-4" : "size-5")}
      />
      <span className="text-meta">{label}</span>
    </div>
  );
}

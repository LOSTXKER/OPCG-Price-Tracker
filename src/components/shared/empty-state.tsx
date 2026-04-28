import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type EmptyStateVariant = "panel" | "plain" | "dashed" | "error";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  /**
   * Visual variant.
   *
   * - `panel`  — wrapped in `.panel` (default). Use inside page content where
   *               there is no enclosing surface yet.
   * - `plain`  — no surface chrome. Use when this is rendered inside an
   *               existing `<Surface />` / `.panel` (e.g. inside a table card).
   * - `dashed` — dashed-border block (legacy blog/marketplace tone).
   * - `error`  — destructive-tinted variant for error/failure states.
   */
  variant?: EmptyStateVariant;
  /** Use a smaller vertical footprint (e.g. inline empty-table). */
  size?: "default" | "sm";
}

/**
 * Unified empty / error state.
 *
 * Single source of truth for "no data / nothing here / something failed"
 * surfaces. Replaces ad-hoc patterns across the app:
 *
 *  - dashed-border blocks (blog)
 *  - `panel + icon + copy` (search, raffle, marketplace error)
 *  - centered `<AlertCircle />` blocks (seller)
 *  - plain `<p className="text-center text-muted-foreground">` (portfolio)
 *
 * For the kuma-branded variant (home, sets, saved, watchlist, etc.) use
 * `<KumaEmptyState />` directly — it has product moods/emoji and is the
 * marketing-style empty state.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  variant = "panel",
  size = "default",
}: EmptyStateProps) {
  const isError = variant === "error";

  const wrapperClass = cn(
    "flex flex-col items-center justify-center gap-3 text-center",
    size === "sm" ? "py-8" : "py-14",
    variant === "panel" && "panel px-6",
    variant === "dashed" && "rounded-xl border border-dashed border-border px-6",
    variant === "error" && "panel border border-destructive/30 px-6",
    variant === "plain" && "px-6",
    className,
  );

  return (
    <div className={wrapperClass}>
      {Icon && (
        <div
          className={cn(
            "flex items-center justify-center rounded-xl",
            isError ? "bg-destructive/10" : "bg-muted/50",
            size === "sm" ? "size-10" : "size-12",
          )}
        >
          <Icon
            className={cn(
              size === "sm" ? "size-5" : "size-6",
              isError ? "text-destructive" : "text-muted-foreground/60",
            )}
          />
        </div>
      )}
      <div className="space-y-1">
        <p className={cn(size === "sm" ? "text-h5" : "text-h4", "text-foreground")}>{title}</p>
        {description && (
          <p className="mx-auto max-w-sm text-meta text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

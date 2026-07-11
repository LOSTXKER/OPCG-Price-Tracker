import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type EmptyStateVariant = "panel" | "plain" | "dashed" | "error";
export type EmptyStateAppearance = "standard" | "product" | "admin" | "minimal";
export type EmptyStatePreset =
  | "no-results"
  | "empty-portfolio"
  | "empty-watchlist"
  | "not-found"
  | "error";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title?: ReactNode;
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
  size?: "sm" | "md";
  /**
   * Optional branded layout. `product` accepts a mascot node so client
   * adapters can provide animation without making this component client-only.
   */
  appearance?: EmptyStateAppearance;
  /** Rendered by the product appearance when no icon is supplied. */
  mascot?: ReactNode | "kuma";
  /** Localized branded copy preset; implies the Kuma product appearance. */
  preset?: EmptyStatePreset;
  lang?: Language;
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
 * Branded Kuma states are selected through `mascot="kuma"` or a `preset`; no
 * second rendering component owns copy or layout.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  variant = "panel",
  size = "md",
  appearance,
  mascot,
  preset,
  lang = "TH",
}: EmptyStateProps) {
  const presets: Record<EmptyStatePreset, { emoji: string; title: string; description?: string }> = {
    "no-results": { emoji: "🐻", title: t(lang, "noResults"), description: t(lang, "noResultsDesc") },
    "empty-portfolio": { emoji: "🐻", title: t(lang, "emptyPortfolio"), description: t(lang, "emptyPortfolioDesc") },
    "empty-watchlist": { emoji: "🐻", title: t(lang, "emptyWatchlist"), description: t(lang, "emptyWatchlistDesc") },
    "not-found": { emoji: "🗺️", title: t(lang, "emptyNotFound"), description: t(lang, "emptyNotFoundDesc") },
    error: { emoji: "🐻", title: t(lang, "emptyError"), description: t(lang, "emptyErrorDesc") },
  };
  const presetConfig = preset ? presets[preset] : null;
  const resolvedTitle = title ?? presetConfig?.title ?? t(lang, "noData");
  const resolvedDescription = description ?? presetConfig?.description;
  const resolvedAppearance =
    appearance ?? (preset || mascot === "kuma" ? "product" : "standard");
  const resolvedMascot =
    mascot === "kuma" || (preset && mascot == null) ? (
      <div aria-hidden className="rise text-5xl select-none">
        {presetConfig?.emoji ?? "🐻"}
      </div>
    ) : mascot;
  const errorA11y =
    variant === "error"
      ? ({ role: "alert", "aria-live": "assertive" } as const)
      : {};

  if (resolvedAppearance === "minimal" && Icon) {
    return (
      <div {...errorA11y} className={cn("flex flex-col items-center gap-2 py-14 text-center", className)}>
        <Icon className="size-8 text-muted-foreground/20" />
        <p className="text-meta text-muted-foreground/60">{resolvedTitle}</p>
      </div>
    );
  }

  if (resolvedAppearance === "admin" && Icon) {
    return (
      <div {...errorA11y} className={cn("flex flex-col items-center gap-3 py-16 text-center", className)}>
        <div className="rounded-xl bg-muted/50 p-4">
          <Icon className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <div>
          <p className="font-medium text-muted-foreground">{resolvedTitle}</p>
          {resolvedDescription && (
            <p className="mt-1 text-sm text-muted-foreground/70">{resolvedDescription}</p>
          )}
        </div>
        {action}
      </div>
    );
  }

  if (resolvedAppearance === "product" && variant === "dashed") {
    return (
      <div
        {...errorA11y}
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground",
          className,
        )}
      >
        {Icon && <Icon className="mb-3 h-12 w-12 opacity-30" />}
        <p className="text-h3 text-foreground">{resolvedTitle}</p>
        {resolvedDescription && (
          <p className="mb-4 mt-1 text-sm text-muted-foreground">{resolvedDescription}</p>
        )}
        {action}
      </div>
    );
  }

  if (resolvedAppearance === "product") {
    return (
      <div
        {...errorA11y}
        className={cn(
          "panel flex flex-col items-center justify-center gap-4 bg-accent/30 px-6 py-16 text-center",
          className,
        )}
      >
        {Icon ? (
          <div className="rounded-xl bg-muted/50 p-4">
            <Icon className="h-8 w-8 text-muted-foreground/40" />
          </div>
        ) : (
          resolvedMascot
        )}
        <div className="space-y-1">
          <h2 className="text-h3">{resolvedTitle}</h2>
          {resolvedDescription && (
            <p className="max-w-sm text-sm text-muted-foreground">{resolvedDescription}</p>
          )}
        </div>
        {action}
      </div>
    );
  }

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
    <div {...errorA11y} className={wrapperClass}>
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
        <p className={cn(size === "sm" ? "text-h5" : "text-h4", "text-foreground")}>{resolvedTitle}</p>
        {resolvedDescription && (
          <p className="mx-auto max-w-sm text-meta text-muted-foreground">{resolvedDescription}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

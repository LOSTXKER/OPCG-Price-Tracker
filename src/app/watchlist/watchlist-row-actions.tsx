"use client";

import { Trash2 } from "lucide-react";

import { t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

import type { WatchlistEntry } from "./watchlist-types";

/**
 * Inline action cluster for a watchlist row/card.
 *
 * Pin, Bell, and the row link to card detail are rendered by the parent
 * because they reflect persistent row state. This component just owns the
 * destructive Remove action so it can be consistently styled across views.
 */
export function WatchlistRowActions({
  onRemove,
  className,
  buttonClassName,
  size = "md",
}: {
  /** Reserved for future inline actions; currently unused. */
  entry?: WatchlistEntry;
  onRemove: () => void;
  className?: string;
  buttonClassName?: string;
  size?: "sm" | "md";
}) {
  const lang = useUIStore((s) => s.language);

  const sizeClass = size === "sm" ? "size-7" : "size-8";
  const iconClass = size === "sm" ? "size-3.5" : "size-4";

  return (
    <div className={cn("inline-flex items-center", className)}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
        title={t(lang, "removeFromWatchlist")}
        aria-label={t(lang, "removeFromWatchlist")}
        className={cn(
          "inline-flex items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
          sizeClass,
          buttonClassName
        )}
      >
        <Trash2 className={iconClass} />
      </button>
    </div>
  );
}

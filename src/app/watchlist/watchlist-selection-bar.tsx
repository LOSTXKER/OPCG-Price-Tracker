"use client";

import { Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

/**
 * Floating selection action bar — pinned to the bottom edge so the actions sit
 * under the thumb/cursor while ticking rows. (The previous top banner replaced
 * the toolbar, so on long lists you had to scroll back up to delete.)
 * Mobile floats above the bottom-nav (same offset math as the profile CTA bar);
 * desktop floats centered near the bottom.
 */
export function WatchlistSelectionBar({
  selectedCount,
  resultCount,
  allVisibleSelected,
  onToggleSelectAll,
  onBulkRemove,
  onCancel,
}: {
  selectedCount: number;
  resultCount: number;
  allVisibleSelected: boolean;
  onToggleSelectAll: () => void;
  onBulkRemove: () => void;
  onCancel: () => void;
}) {
  const lang = useUIStore((s) => s.language);

  return (
    <div
      className="fixed inset-x-0 z-40 flex justify-center px-3 md:bottom-6"
      style={{ bottom: "calc(4rem + env(safe-area-inset-bottom) + 0.75rem)" }}
      role="toolbar"
      aria-label={t(lang, "watchlistSelected")}
    >
      <div className="flex w-full max-w-xl flex-wrap items-center gap-2 rounded-2xl border border-primary/30 bg-card p-2 [box-shadow:var(--elev-raised)] md:w-auto md:flex-nowrap">
        <span
          className={cn(
            "px-2 text-label tabular-nums",
            selectedCount > 0 ? "text-primary" : "text-muted-foreground",
          )}
          aria-live="polite"
        >
          {selectedCount} {t(lang, "watchlistSelected")}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onToggleSelectAll}
            disabled={resultCount === 0}
            className="min-h-11 md:min-h-9"
          >
            {allVisibleSelected ? t(lang, "deselectAll") : t(lang, "watchlistSelectAll")}
          </Button>

          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={onBulkRemove}
            disabled={selectedCount === 0}
            className="min-h-11 md:min-h-9"
          >
            <Trash2 className="size-3.5" />
            {t(lang, "watchlistRemoveSelected")}
            {selectedCount > 0 && (
              <span className="tabular-nums">({selectedCount})</span>
            )}
          </Button>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onCancel}
            className="min-h-11 md:min-h-9"
            aria-label={t(lang, "cancel")}
          >
            <X className="size-4 md:hidden" aria-hidden />
            <span className="hidden md:inline">{t(lang, "cancel")}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

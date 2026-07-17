"use client";

import { useEffect, useRef } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

/**
 * Select-mode action bar — sits directly above the table header and sticks
 * under the global chrome while scrolling (owner: "เอาไว้บนหัวตาราง...
 * มันจะตามจอเวลาเลื่อนลง"). Carries the select-all tick + count + actions,
 * Gmail-style; row checkboxes stay on the rows themselves.
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
  const selectAllRef = useRef<HTMLInputElement>(null);

  // Partial selection shows the standard indeterminate dash on the tick.
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        selectedCount > 0 && !allVisibleSelected;
    }
  }, [selectedCount, allVisibleSelected]);

  return (
    <div
      className="sticky top-[var(--chrome-h)] z-30 -mx-1 flex flex-wrap items-center gap-2 border-b border-hair bg-background/95 px-1 py-2 backdrop-blur-sm"
      role="toolbar"
      aria-label={t(lang, "watchlistSelected")}
    >
      <label className="flex min-h-11 cursor-pointer select-none items-center gap-2.5 px-2 md:min-h-9">
        <input
          ref={selectAllRef}
          type="checkbox"
          className="size-4 cursor-pointer accent-primary"
          checked={allVisibleSelected && resultCount > 0}
          onChange={onToggleSelectAll}
          disabled={resultCount === 0}
        />
        <span className="text-label">{t(lang, "watchlistSelectAll")}</span>
      </label>

      <span
        className={cn(
          "text-meta tabular-nums",
          selectedCount > 0 && "text-primary",
        )}
        aria-live="polite"
      >
        {selectedCount} {t(lang, "watchlistSelected")}
      </span>

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
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
        >
          {t(lang, "cancel")}
        </Button>
      </div>
    </div>
  );
}

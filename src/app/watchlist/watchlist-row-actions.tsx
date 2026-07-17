"use client";

import { Bell, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getCardName, t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

import type { WatchlistEntry } from "./watchlist-types";

/**
 * Mobile long-press sheet for a single watchlist row. The Apple-Stocks row
 * anatomy drops the trailing ⋯ menu — its actions moved here (desktop gets
 * the same via the hover-reveal icon cluster in the table).
 */
export function WatchlistRowActionsDialog({
  entry,
  open,
  onOpenChange,
  onSetAlert,
  onRemove,
}: {
  entry: WatchlistEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSetAlert: () => void;
  onRemove: () => void;
}) {
  const lang = useUIStore((s) => s.language);
  const displayName = getCardName(lang, entry.card);

  const act = (fn: () => void) => () => {
    onOpenChange(false);
    fn();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-3">
        <DialogHeader>
          <DialogTitle className="truncate">{displayName}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-0.5">
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 w-full justify-start gap-2.5"
            onClick={act(onSetAlert)}
          >
            <Bell
              className={cn(
                "size-4",
                entry.hasActiveAlert && "fill-current text-primary",
              )}
            />
            {entry.hasActiveAlert ? t(lang, "watchlistHasAlert") : t(lang, "setPriceAlert")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 w-full justify-start gap-2.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={act(onRemove)}
          >
            <Trash2 className="size-4" />
            {t(lang, "removeFromWatchlist")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

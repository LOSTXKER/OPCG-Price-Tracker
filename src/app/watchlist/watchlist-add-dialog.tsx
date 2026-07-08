"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CardPickerForm } from "@/components/shared/card-picker-form";
import { useUpgradeDialog } from "@/components/shared/upgrade-dialog";
import { ApiError, apiPost } from "@/lib/api/client";
import { getCardName, t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";
import type { CardSearchResult } from "@/hooks/use-card-search";

/**
 * Add cards to the watchlist in-place (the missing affordance — every other MINE
 * page already has its own add). Uses the shared CardSearch in pick mode; stays
 * open so you can add several in a row. POST is an upsert, so re-adding is a no-op.
 */
export function WatchlistAddDialog({
  open,
  onOpenChange,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdded: () => void;
}) {
  const lang = useUIStore((s) => s.language);
  const { openUpgradeDialog } = useUpgradeDialog();
  const [busy, setBusy] = useState(false);

  const add = async (card: CardSearchResult) => {
    if (busy) return;
    setBusy(true);
    try {
      await apiPost("/api/watchlist", { cardId: card.id });
      toast.success(t(lang, "addToWatchlist"), { description: getCardName(lang, card) });
      onAdded();
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        openUpgradeDialog({ featureKey: "watchlistCards" });
      } else {
        toast.error(t(lang, "watchlistUpdateFailed"));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex flex-col gap-0 overflow-hidden p-0"
        style={{ maxWidth: "min(46rem, calc(100% - 2rem))", maxHeight: "85dvh" }}
      >
        {/* The one shared card picker (search + filters + value list). Adding
            is an upsert + stays open, so you can add several in a row. */}
        <CardPickerForm onSelect={add} />
      </DialogContent>
    </Dialog>
  );
}

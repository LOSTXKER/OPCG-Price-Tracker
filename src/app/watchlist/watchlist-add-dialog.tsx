"use client";

import { toast } from "sonner";

import { CardBatchPickerDialog } from "@/components/shared/card-batch-picker-dialog";
import type { CardWithSet } from "@/components/shared/card-picker-form";
import { useUpgradeDialog } from "@/components/shared/upgrade-dialog";
import { useTierLimits } from "@/hooks/use-tier-limits";
import { ApiError, apiPost } from "@/lib/api/client";
import { t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";

/**
 * Add cards to the watchlist. Tapping a card doesn't fire the action straight
 * away (เบส: "อย่าพึ่ง action... ให้คนรู้ว่ากดแล้วจะทำ") — it toggles the card
 * into a pending selection you can see, then the footer button commits the whole
 * batch. POST is an upsert, so re-adding is a no-op.
 */
export function WatchlistAddDialog({
  open,
  onOpenChange,
  onAdded,
  currentCount,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdded: () => void;
  currentCount: number;
}) {
  const lang = useUIStore((s) => s.language);
  const { openUpgradeDialog } = useUpgradeDialog();
  const { limits } = useTierLimits();
  const remaining = Number.isFinite(limits.watchlistCards)
    ? Math.max(0, limits.watchlistCards - currentCount)
    : Number.POSITIVE_INFINITY;

  const addCards = async (cards: CardWithSet[]) => {
    let addedCount = 0;
    try {
      for (const card of cards) {
        await apiPost("/api/watchlist", { cardId: card.id });
        addedCount += 1;
      }
      toast.success(t(lang, "addToWatchlist"), {
        description: `${cards.length} ${t(lang, "card")}`,
      });
      onAdded();
      return true;
    } catch (err) {
      // Requests are sequential, so an early card may already be persisted
      // when a later one hits the tier limit or the network fails. Refresh the
      // page/store snapshot even while keeping the picker open for retry.
      if (addedCount > 0) onAdded();
      if (err instanceof ApiError && err.status === 403) {
        openUpgradeDialog({ featureKey: "watchlistCards" });
      } else {
        toast.error(t(lang, "watchlistUpdateFailed"));
      }
      return false;
    }
  };

  return (
    <CardBatchPickerDialog
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={addCards}
      emptySubmitLabel={t(lang, "selectCardsToAdd")}
      submittingLabel={t(lang, "adding")}
      submitLabel={(count) => `${t(lang, "addToWatchlist")} (${count})`}
      maxSelection={remaining}
      selectionLimitLabel={
        Number.isFinite(remaining)
          ? t(
              lang,
              remaining === 0
                ? "watchlistQuotaFull"
                : "watchlistPickerRemaining",
            ).replace("{count}", String(remaining))
          : undefined
      }
    />
  );
}

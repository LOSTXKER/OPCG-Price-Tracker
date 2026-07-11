"use client";

import { toast } from "sonner";

import { CardBatchPickerDialog } from "@/components/shared/card-batch-picker-dialog";
import type { CardWithSet } from "@/components/shared/card-picker-form";
import { useUpgradeDialog } from "@/components/shared/upgrade-dialog";
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
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdded: () => void;
}) {
  const lang = useUIStore((s) => s.language);
  const { openUpgradeDialog } = useUpgradeDialog();

  const addCards = async (cards: CardWithSet[]) => {
    try {
      for (const card of cards) {
        await apiPost("/api/watchlist", { cardId: card.id });
      }
      toast.success(t(lang, "addToWatchlist"), {
        description: `${cards.length} ${t(lang, "card")}`,
      });
      onAdded();
      return true;
    } catch (err) {
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
      submitLabel={(count) => `${t(lang, "addToWatchlist")} (${count})`}
    />
  );
}

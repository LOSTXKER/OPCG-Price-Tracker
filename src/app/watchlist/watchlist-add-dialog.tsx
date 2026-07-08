"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CardPickerForm, type CardWithSet } from "@/components/shared/card-picker-form";
import { useUpgradeDialog } from "@/components/shared/upgrade-dialog";
import { ApiError, apiPost } from "@/lib/api/client";
import { getCardName, t } from "@/lib/i18n";
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
  const [pending, setPending] = useState<CardWithSet[]>([]);
  const [busy, setBusy] = useState(false);

  // Drop the pending selection whenever the dialog closes.
  useEffect(() => {
    if (!open) setPending([]);
  }, [open]);

  const toggle = (card: CardWithSet) => {
    setPending((prev) =>
      prev.some((c) => c.id === card.id)
        ? prev.filter((c) => c.id !== card.id)
        : [...prev, card],
    );
  };

  const commit = async () => {
    if (busy || pending.length === 0) return;
    setBusy(true);
    try {
      for (const card of pending) {
        await apiPost("/api/watchlist", { cardId: card.id });
      }
      toast.success(t(lang, "addToWatchlist"), {
        description: `${pending.length} ${t(lang, "card")}`,
      });
      onAdded();
      setPending([]);
      onOpenChange(false);
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
        style={{ maxWidth: "min(52rem, calc(100% - 2rem))", maxHeight: "85dvh" }}
      >
        {/* Tap toggles selection (multi-pick); the footer commits the batch. The
            footer is passed INTO the picker so the filter overlay covers it. */}
        <CardPickerForm
          onSelect={toggle}
          isSelected={(c) => pending.some((p) => p.id === c.id)}
          railExtra={
            <div className="mt-4 flex min-h-0 flex-1 flex-col border-t border-hair pt-3">
              <p className="mb-2 text-eyebrow">
                {t(lang, "selectedCards")}
                {pending.length > 0 ? ` (${pending.length})` : ""}
              </p>
              {pending.length === 0 ? (
                <p className="flex flex-1 items-center justify-center px-2 text-center text-meta text-muted-foreground/40">
                  {t(lang, "tapCardsToSelect")}
                </p>
              ) : (
                <ul className="-mr-1 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
                  {pending.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center gap-2 rounded-lg bg-muted/40 py-1.5 pl-2.5 pr-1"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {getCardName(lang, c)}
                      </span>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground/60">
                        {c.cardCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggle(c)}
                        aria-label={t(lang, "remove")}
                        className="tap-safe shrink-0 rounded p-0.5 text-muted-foreground/50 hover:text-danger"
                      >
                        <X className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          }
          footer={
            <div className="border-t border-hair p-3">
              <button
                type="button"
                onClick={() => void commit()}
                disabled={pending.length === 0 || busy}
                className="ease-chrome h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {pending.length === 0
                  ? t(lang, "selectCardsToAdd")
                  : `${t(lang, "addToWatchlist")} (${pending.length})`}
              </button>
            </div>
          }
        />
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";
import {
  currencySymbol,
  displayValueToJpy,
  formatJpy,
  jpyToDisplayValue,
} from "@/lib/utils/currency";

import type { WatchlistEntry } from "./watchlist-types";

const NOTE_MAX = 280;

export function WatchlistEditDialog({
  open,
  entry,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  entry: WatchlistEntry | null;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    cardId: number;
    note: string | null;
    targetPriceJpy: number | null;
  }) => Promise<boolean>;
}) {
  const lang = useUIStore((s) => s.language);
  const currency = useUIStore((s) => s.currency);

  const [note, setNote] = useState("");
  const [target, setTarget] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (entry && open) {
      setNote(entry.note ?? "");
      setTarget(
        entry.targetPriceJpy != null
          ? Math.round(jpyToDisplayValue(entry.targetPriceJpy, currency)).toString()
          : ""
      );
      setError(null);
    }
  }, [entry, open, currency]);

  if (!entry) return null;

  const cardName = entry.card.nameEn ?? entry.card.nameJp ?? entry.card.cardCode;
  const symbol = currencySymbol(currency);
  const placeholder =
    entry.card.latestPriceJpy != null
      ? Math.round(jpyToDisplayValue(entry.card.latestPriceJpy, currency)).toString()
      : "";

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const trimmedNote = note.trim();
      const targetRaw = target.trim();
      let targetJpy: number | null = null;
      if (targetRaw) {
        const n = Number(targetRaw);
        if (!Number.isFinite(n) || n <= 0) {
          setError(t(lang, "watchlistTargetPrice"));
          setSubmitting(false);
          return;
        }
        targetJpy = Math.round(displayValueToJpy(n, currency));
      }
      const ok = await onSave({
        cardId: entry.cardId,
        note: trimmedNote.length === 0 ? null : trimmedNote.slice(0, NOTE_MAX),
        targetPriceJpy: targetJpy,
      });
      if (ok) {
        onOpenChange(false);
      } else {
        setError(t(lang, "watchlistUpdateFailed"));
      }
    } catch {
      setError(t(lang, "watchlistUpdateFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t(lang, "watchlistEditDetails")}</DialogTitle>
          <DialogDescription className="truncate">{cardName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-meta">
              {t(lang, "watchlistTargetPrice")}
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {symbol}
              </span>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                placeholder={placeholder}
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="pl-7"
              />
            </div>
            {entry.card.latestPriceJpy != null && (
              <p className="mt-1 text-meta text-muted-foreground/70">
                {t(lang, "marketPrice")}: {formatJpy(entry.card.latestPriceJpy)}
              </p>
            )}
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-meta">{t(lang, "watchlistNote")}</label>
              <span className="text-meta text-muted-foreground/70 tabular-nums">
                {note.length}/{NOTE_MAX}
              </span>
            </div>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX))}
              placeholder={t(lang, "watchlistNotePlaceholder")}
              rows={3}
              maxLength={NOTE_MAX}
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            {t(lang, "cancel")}
          </Button>
          <Button
            size="sm"
            disabled={submitting}
            onClick={() => void handleSubmit()}
          >
            {submitting ? t(lang, "saving") : t(lang, "watchlistSaveChanges")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

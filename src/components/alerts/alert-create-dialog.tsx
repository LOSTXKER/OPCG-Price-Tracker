"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CardSearch } from "@/components/shared/card-search";
import { useUIStore } from "@/stores/ui-store";
import { useUpgradeDialog } from "@/components/shared/upgrade-dialog";
import { type CardSearchResult } from "@/hooks/use-card-search";
import { t, getCardName } from "@/lib/i18n";
import {
  AlertFormBody,
  type AlertFormValue,
} from "@/components/alerts/alert-form";
import { displayValueToJpy, formatJpy } from "@/lib/utils/currency";
import { ApiError, apiPost } from "@/lib/api/client";
import { BLUR_DATA_URL } from "@/lib/constants/ui";
import type { PriceAlertItem } from "./alert-types";

type Step = "pick" | "form";

export function AlertCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (next: PriceAlertItem) => void;
}) {
  const lang = useUIStore((s) => s.language);
  const currency = useUIStore((s) => s.currency);
  const { openUpgradeDialog } = useUpgradeDialog();

  const [step, setStep] = useState<Step>("pick");
  const [card, setCard] = useState<CardSearchResult | null>(null);
  const [value, setValue] = useState<AlertFormValue>({
    direction: "BELOW",
    channels: ["EMAIL"],
    target: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep("pick");
    setCard(null);
    setValue({ direction: "BELOW", channels: ["EMAIL"], target: "" });
    setError(null);
    setSubmitting(false);
  }, [open]);

  const handlePickCard = (c: CardSearchResult) => {
    setCard(c);
    setStep("form");
    setError(null);
  };

  const handleSubmit = async () => {
    if (!card) return;
    setError(null);
    const raw = value.target.trim() ? Number(value.target) : NaN;
    if (!Number.isFinite(raw) || raw <= 0) {
      setError(t(lang, "targetPrice"));
      return;
    }
    const targetJpy = Math.round(displayValueToJpy(raw, currency));

    setSubmitting(true);
    try {
      const json = await apiPost<{ alert: PriceAlertItem }>("/api/alerts", {
        cardId: card.id,
        targetPrice: targetJpy,
        direction: value.direction,
        channels: value.channels,
      });

      onCreated?.(json.alert);
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      if (err instanceof ApiError && err.status === 403) {
        if (err.message.toLowerCase().includes("line")) {
          openUpgradeDialog({ featureKey: "lineAlerts" });
        } else {
          openUpgradeDialog({ featureKey: "priceAlerts" });
        }
        onOpenChange(false);
        return;
      }
      setError(err instanceof ApiError ? err.message : t(lang, "priceAlertFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const cardName = card ? getCardName(lang, card) : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-md">
        <DialogHeader className="border-b px-5 py-3.5">
          <div className="flex items-center gap-2">
            {step === "form" && (
              <button
                type="button"
                aria-label={t(lang, "back")}
                onClick={() => {
                  setStep("pick");
                  setError(null);
                }}
                className="-ml-2 inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
              >
                <ArrowLeft className="size-4" />
              </button>
            )}
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-h4">{t(lang, "createAlert")}</DialogTitle>
              <DialogDescription className="mt-0.5 truncate text-meta">
                {step === "pick"
                  ? t(lang, "browseCardsToAlert")
                  : cardName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {step === "pick" ? (
          <div className="min-h-[240px] px-5 py-4">
            {/* MINE add flow: search EVERY game — the picked card carries its
                own game, so we never lock the search to the current game. */}
            <CardSearch mode="pick" game="all" onSelect={handlePickCard} autoFocus />
          </div>
        ) : (
          card && (
            <div className="space-y-4 px-5 pb-5 pt-4">
              {/* Selected card preview */}
              <button
                type="button"
                onClick={() => {
                  setStep("pick");
                  setError(null);
                }}
                className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/70"
              >
                <div className="relative aspect-[63/88] w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                  {card.imageUrl ? (
                    <Image
                      src={card.imageUrl}
                      alt={cardName}
                      fill
                      sizes="40px"
                      className="object-contain"
                      placeholder="blur"
                      blurDataURL={BLUR_DATA_URL}
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{cardName}</p>
                  <p className="truncate text-meta text-muted-foreground/70">
                    {card.cardCode}
                    {card.latestPriceJpy != null && (
                      <>
                        {" · "}
                        <span className="tabular-nums">{formatJpy(card.latestPriceJpy)}</span>
                      </>
                    )}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="shrink-0 text-meta"
                  onClick={(e) => {
                    e.stopPropagation();
                    setStep("pick");
                    setError(null);
                  }}
                >
                  {t(lang, "change")}
                </Button>
              </button>

              <AlertFormBody
                value={value}
                onChange={setValue}
                currentPriceJpy={card.latestPriceJpy}
                error={error}
                submitting={submitting}
                onSubmit={() => void handleSubmit()}
                submitLabel={t(lang, "createAlert")}
              />
            </div>
          )
        )}
      </DialogContent>
    </Dialog>
  );
}

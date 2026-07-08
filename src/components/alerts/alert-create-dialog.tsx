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
import { CardPickerForm } from "@/components/shared/card-picker-form";
import { useUIStore } from "@/stores/ui-store";
import { useAlertSubmit } from "@/hooks/use-alert-submit";
import { type CardSearchResult } from "@/hooks/use-card-search";
import { t, getCardName } from "@/lib/i18n";
import {
  AlertFormBody,
  type AlertFormValue,
} from "@/components/alerts/alert-form";
import { formatJpy } from "@/lib/utils/currency";
import { apiPost } from "@/lib/api/client";
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
  const { submit, submitting, error, setError } = useAlertSubmit();

  const [step, setStep] = useState<Step>("pick");
  const [card, setCard] = useState<CardSearchResult | null>(null);
  const [value, setValue] = useState<AlertFormValue>({
    direction: "BELOW",
    channels: ["EMAIL"],
    target: "",
  });
  useEffect(() => {
    if (!open) return;
    setStep("pick");
    setCard(null);
    setValue({ direction: "BELOW", channels: ["EMAIL"], target: "" });
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setError is a stable useState setter from useAlertSubmit
  }, [open]);

  const handlePickCard = (c: CardSearchResult) => {
    setCard(c);
    setStep("form");
    setError(null);
  };

  const handleSubmit = () => {
    if (!card) return;
    const picked = card;
    submit({
      target: value.target,
      request: (targetJpy) =>
        apiPost<{ alert: PriceAlertItem }>("/api/alerts", {
          cardId: picked.id,
          targetPrice: targetJpy,
          direction: value.direction,
          channels: value.channels,
        }),
      onSuccess: (json) => {
        onCreated?.(json.alert);
        onOpenChange(false);
      },
      onGated: () => onOpenChange(false),
    });
  };

  const cardName = card ? getCardName(lang, card) : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex flex-col gap-0 overflow-hidden p-0 max-md:!inset-0 max-md:!max-h-none max-md:!max-w-none max-md:!translate-x-0 max-md:!translate-y-0 max-md:!rounded-none md:h-auto md:max-h-[85dvh] md:w-full md:max-w-[34rem]"
      >
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
                className="tap-safe -ml-2 inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
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
          /* The one shared card picker (search + filters + value list). Its
             fragment expands into this flex column, so the list fills the
             remaining height. Host owns the header, so showHeader={false}. */
          <CardPickerForm onSelect={handlePickCard} showHeader={false} />
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

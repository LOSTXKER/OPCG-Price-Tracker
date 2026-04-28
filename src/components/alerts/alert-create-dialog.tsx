"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Loader2, Search, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui-store";
import { useUpgradeDialog } from "@/components/shared/upgrade-dialog";
import { useCardSearch, type CardSearchResult } from "@/hooks/use-card-search";
import { t, getCardName } from "@/lib/i18n";
import {
  AlertFormBody,
  type AlertFormValue,
} from "@/components/alerts/alert-form";
import { displayValueToJpy, formatJpy } from "@/lib/utils/currency";
import { BLUR_DATA_URL } from "@/lib/constants/ui";
import { cn } from "@/lib/utils";
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

  const { query, setQuery, results, loading } = useCardSearch({
    debounceMs: 250,
    limit: 12,
  });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setStep("pick");
    setCard(null);
    setValue({ direction: "BELOW", channels: ["EMAIL"], target: "" });
    setError(null);
    setSubmitting(false);
    setQuery("");
    const id = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(id);
    // setQuery is stable from the hook; reset on `open` toggle only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: card.id,
          targetPrice: targetJpy,
          direction: value.direction,
          channels: value.channels,
        }),
      });

      if (res.status === 401) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 403) {
          const msg: string = typeof json?.error === "string" ? json.error : "";
          if (msg.toLowerCase().includes("line")) {
            openUpgradeDialog({ featureKey: "lineAlerts" });
          } else {
            openUpgradeDialog({ featureKey: "priceAlerts" });
          }
          onOpenChange(false);
          return;
        }
        setError(json?.error ?? t(lang, "priceAlertFailed"));
        return;
      }

      onCreated?.(json.alert as PriceAlertItem);
      onOpenChange(false);
    } catch {
      setError(t(lang, "priceAlertFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const cardName = card ? getCardName(lang, card) : "";
  const showEmpty = !loading && query.trim().length >= 2 && results.length === 0;
  const showHint = query.trim().length < 2;

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
                className="-ml-2 inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
              >
                <ArrowLeft className="size-4" />
              </button>
            )}
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-h5">{t(lang, "createAlert")}</DialogTitle>
              <DialogDescription className="mt-0.5 truncate text-meta">
                {step === "pick"
                  ? t(lang, "browseCardsToAlert")
                  : cardName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {step === "pick" ? (
          <div className="flex max-h-[70vh] flex-col">
            {/* Search input */}
            <div className="border-b px-5 py-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t(lang, "searchPlaceholder")}
                  className="h-9 pl-9 pr-8"
                />
                {query.length > 0 && (
                  <button
                    type="button"
                    aria-label="Clear"
                    onClick={() => {
                      setQuery("");
                      inputRef.current?.focus();
                    }}
                    className="absolute right-2 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Results */}
            <div className="min-h-[240px] flex-1 overflow-y-auto px-2 py-2">
              {showHint && (
                <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center text-meta">
                  <Search className="size-5 text-muted-foreground/50" />
                  <p>{t(lang, "searchPlaceholder")}</p>
                </div>
              )}

              {loading && results.length === 0 && (
                <div className="space-y-1 px-1">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-2 py-2">
                      <Skeleton className="size-10 rounded-md" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3 w-3/5" />
                        <Skeleton className="h-3 w-2/5" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.length > 0 && (
                <ul className="space-y-0.5">
                  {results.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => handlePickCard(c)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors",
                          "hover:bg-foreground/[0.04]",
                        )}
                      >
                        <div className="relative aspect-[63/88] w-9 shrink-0 overflow-hidden rounded-md bg-muted">
                          {c.imageUrl ? (
                            <Image
                              src={c.imageUrl}
                              alt={getCardName(lang, c)}
                              fill
                              sizes="36px"
                              className="object-contain"
                              placeholder="blur"
                              blurDataURL={BLUR_DATA_URL}
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{getCardName(lang, c)}</p>
                          <p className="truncate text-meta text-muted-foreground/70">
                            {c.cardCode}
                          </p>
                        </div>
                        {c.latestPriceJpy != null && (
                          <span className="shrink-0 text-meta tabular-nums text-muted-foreground">
                            {formatJpy(c.latestPriceJpy)}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {showEmpty && (
                <div className="flex flex-col items-center justify-center gap-1 px-4 py-12 text-center">
                  <p className="text-sm text-muted-foreground">{t(lang, "noCardsFound")}</p>
                  <p className="text-meta">{t(lang, "noCardsFoundDesc")}</p>
                </div>
              )}

              {loading && results.length > 0 && (
                <div className="flex justify-center pb-2 pt-1">
                  <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
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
                className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-foreground/[0.04]"
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

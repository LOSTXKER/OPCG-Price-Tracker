"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CardPickerForm,
  type CardWithSet,
} from "@/components/shared/card-picker-form";
import { cn } from "@/lib/utils";
import { CARD_BG } from "@/lib/constants/ui";
import { t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";
import { ChevronRight } from "lucide-react";

export type SelectedCard = {
  id?: number;
  cardCode: string;
  nameJp: string;
  nameEn: string | null;
  rarity: string;
  imageUrl: string | null;
  latestPriceJpy: number | null;
  latestPriceThb: number | null;
};

interface StepCardSelectProps {
  selected: SelectedCard | null;
  onSelect: (card: SelectedCard) => void;
  onNext: () => void;
}

export function StepCardSelect({
  selected,
  onSelect,
  onNext,
}: StepCardSelectProps) {
  const lang = useUIStore((s) => s.language);

  const handlePick = (c: CardWithSet) => {
    onSelect({
      cardCode: c.cardCode,
      nameJp: c.nameJp,
      nameEn: c.nameEn ?? null,
      rarity: c.rarity ?? "",
      imageUrl: c.imageUrl ?? null,
      latestPriceJpy: c.latestPriceJpy ?? null,
      latestPriceThb: c.latestPriceThb ?? null,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-h3">{t(lang, "mktSelectHeading")}</h2>
        <p className="text-sm text-muted-foreground">
          {t(lang, "mktSelectSubtitle")}
        </p>
      </div>

      {/* Central card picker (owns its own search + filter + list). Inline wizard
          step → showHeader={false} (the step already has its own heading above,
          and DialogTitle can't render outside a Dialog). Bounded-height flex-col
          so the list's flex-1 overflow-y-auto scrolls internally instead of
          pushing the Next button off-screen. */}
      <div
        className="flex flex-col overflow-hidden rounded-lg border border-hair"
        style={{ height: "min(28rem, 60dvh)" }}
      >
        <CardPickerForm onSelect={handlePick} showHeader={false} />
      </div>

      {selected && (
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="flex items-start gap-4">
            <div className={cn("relative aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-lg", CARD_BG)}>
              {selected.imageUrl ? (
                <Image
                  src={selected.imageUrl}
                  alt={selected.nameEn ?? selected.nameJp}
                  fill
                  className="object-contain"
                />
              ) : (
                <span className="flex size-full items-center justify-center text-meta">
                  No image
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="font-semibold">
                {selected.nameEn ?? selected.nameJp}
              </p>
              <p className="font-mono text-sm text-muted-foreground">
                {selected.cardCode}
              </p>
              <div className="flex gap-1.5">
                {selected.rarity && (
                  <Badge variant="outline">{selected.rarity}</Badge>
                )}
              </div>
              {selected.latestPriceJpy != null && (
                <p className="text-sm">
                  {t(lang, "mktSelectMarketPrice")} <span className="font-semibold">¥{selected.latestPriceJpy.toLocaleString()}</span>
                  {selected.latestPriceThb != null && (
                    <span className="text-muted-foreground">
                      {" "}(~฿{selected.latestPriceThb.toLocaleString()})
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!selected} className="gap-1">
          {t(lang, "mktSelectNext")}
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

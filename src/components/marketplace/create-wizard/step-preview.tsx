"use client";

import Image from "next/image";
import { Price } from "@/components/shared/price-inline";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CARD_BG } from "@/lib/constants/ui";
import { ChevronLeft, Upload } from "lucide-react";
import { t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";
import type { SelectedCard } from "./step-card-select";
import type { PricingData } from "./step-pricing";
import type { ShippingData } from "./step-shipping";

interface StepPreviewProps {
  card: SelectedCard;
  pricing: PricingData;
  shipping: ShippingData;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  onEditStep: (step: "card" | "pricing" | "shipping") => void;
}

export function StepPreview({
  card,
  pricing,
  shipping,
  onBack,
  onSubmit,
  isSubmitting,
  onEditStep,
}: StepPreviewProps) {
  const lang = useUIStore((s) => s.language);
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-h3">{t(lang, "mktPreviewTitle")}</h2>
        <p className="text-sm text-muted-foreground">
          {t(lang, "mktPreviewSubtitle")}
        </p>
      </div>

      {/* Preview card */}
      <div className="rounded-xl border overflow-hidden">
        {/* Card info */}
        <div className="flex gap-4 p-4">
          <div className={cn("relative aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-lg", CARD_BG)}>
            {card.imageUrl ? (
              <Image
                src={card.imageUrl}
                alt={card.nameEn ?? card.nameJp}
                fill
                className="object-contain"
              />
            ) : (
              <span className="flex size-full items-center justify-center text-meta">
                {t(lang, "mktPreviewNoImage")}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-semibold">{card.nameEn ?? card.nameJp}</p>
            <p className="font-mono text-sm text-muted-foreground">
              {card.cardCode}
            </p>
            <div className="flex gap-1.5">
              {card.rarity && <Badge variant="outline">{card.rarity}</Badge>}
            </div>
            <button
              type="button"
              onClick={() => onEditStep("card")}
              className="text-xs text-primary hover:underline"
            >
              {t(lang, "mktPreviewEdit")}
            </button>
          </div>
        </div>

        {/* Pricing */}
        <div className="border-t p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t(lang, "mktPreviewPrice")}</span>
            <Price
              jpy={pricing.priceJpy}
              thb={pricing.priceThb}
              className="text-lg font-bold tabular-nums"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t(lang, "mktPreviewCondition")}</span>
            <Badge variant="outline">{pricing.condition}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t(lang, "mktPreviewQuantity")}</span>
            <span className="text-sm font-medium">{pricing.quantity} {t(lang, "mktPreviewQuantityUnit")}</span>
          </div>
          <button
            type="button"
            onClick={() => onEditStep("pricing")}
            className="text-xs text-primary hover:underline"
          >
            {t(lang, "mktPreviewEdit")}
          </button>
        </div>

        {/* Shipping & description */}
        <div className="border-t p-4 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm text-muted-foreground">{t(lang, "mktPreviewShipping")}</span>
            <span className="text-sm text-right">
              {shipping.shipping.length > 0
                ? shipping.shipping.join(", ")
                : t(lang, "mktPreviewNotSpecified")}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t(lang, "mktPreviewLocation")}</span>
            <span className="text-sm">{shipping.location}</span>
          </div>
          {shipping.photos.length > 0 && (
            <div>
              <span className="text-sm text-muted-foreground">
                {t(lang, "mktPreviewPhotos").replace("{n}", String(shipping.photos.length))}
              </span>
              <div className="mt-1.5 flex gap-2 overflow-x-auto">
                {shipping.photos.map((url, i) => (
                  <div
                    key={url}
                    className="relative size-16 flex-shrink-0 overflow-hidden rounded-lg border"
                  >
                    <Image
                      src={url}
                      alt={`Photo ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          {shipping.description && (
            <div>
              <span className="text-sm text-muted-foreground">{t(lang, "mktPreviewDescription")}</span>
              <p className="mt-0.5 text-sm whitespace-pre-wrap">
                {shipping.description}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={() => onEditStep("shipping")}
            className="text-xs text-primary hover:underline"
          >
            {t(lang, "mktPreviewEdit")}
          </button>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-1">
          <ChevronLeft className="size-4" />
          {t(lang, "mktPreviewBack")}
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="gap-2"
        >
          <Upload className="size-4" />
          {isSubmitting ? t(lang, "mktPreviewSubmitting") : t(lang, "mktPreviewSubmit")}
        </Button>
      </div>
    </div>
  );
}

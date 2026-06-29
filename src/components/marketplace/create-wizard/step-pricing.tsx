"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CONDITIONS = ["NM", "LP", "MP", "HP", "DMG"] as const;

const CONDITION_LABEL_KEYS: Record<string, string> = {
  NM: "mktPriceConditionNM",
  LP: "mktPriceConditionLP",
  MP: "mktPriceConditionMP",
  HP: "mktPriceConditionHP",
  DMG: "mktPriceConditionDMG",
};

export interface PricingData {
  priceJpy: number;
  priceThb: number | null;
  condition: string;
  quantity: number;
}

interface StepPricingProps {
  data: PricingData;
  onChange: (data: PricingData) => void;
  marketPriceJpy: number | null;
  marketPriceThb: number | null;
  onBack: () => void;
  onNext: () => void;
}

export function StepPricing({
  data,
  onChange,
  marketPriceJpy,
  marketPriceThb,
  onBack,
  onNext,
}: StepPricingProps) {
  const lang = useUIStore((s) => s.language);
  const update = (partial: Partial<PricingData>) =>
    onChange({ ...data, ...partial });

  const quickPrices = marketPriceJpy
    ? [
        { label: "-10%", value: Math.round(marketPriceJpy * 0.9) },
        { label: t(lang, "mktPriceQuickMarket"), value: marketPriceJpy },
        { label: "+10%", value: Math.round(marketPriceJpy * 1.1) },
      ]
    : [];

  const diffPct =
    marketPriceJpy && data.priceJpy > 0
      ? ((data.priceJpy - marketPriceJpy) / marketPriceJpy) * 100
      : null;

  const isValid = data.priceJpy > 0 && data.quantity >= 1 && data.condition;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-h3">{t(lang, "mktPriceTitle")}</h2>
        <p className="text-sm text-muted-foreground">
          {t(lang, "mktPriceSubtitle")}
        </p>
      </div>

      {/* Condition */}
      <div className="space-y-2">
        <label className="text-label">{t(lang, "mktPriceConditionLabel")}</label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {CONDITIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => update({ condition: c })}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border p-2 text-sm font-medium transition-colors",
                data.condition === c
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:bg-muted"
              )}
            >
              {c}
            </button>
          ))}
        </div>
        {data.condition && (
          <p className="text-meta">
            {t(lang, CONDITION_LABEL_KEYS[data.condition] as Parameters<typeof t>[1])}
          </p>
        )}
      </div>

      {/* Price */}
      <div className="space-y-2">
        <label className="text-label">{t(lang, "mktPricePriceLabel")}</label>
        <Input
          type="number"
          min={1}
          step={1}
          value={data.priceJpy || ""}
          onChange={(e) => update({ priceJpy: parseInt(e.target.value, 10) || 0 })}
          className="text-lg font-bold"
          placeholder="¥0"
        />
        {quickPrices.length > 0 && (
          <div className="flex gap-1.5">
            {quickPrices.map((qp) => (
              <Button
                key={qp.label}
                type="button"
                variant="outline"
                size="xs"
                onClick={() => update({ priceJpy: qp.value })}
              >
                {qp.label} (¥{qp.value.toLocaleString()})
              </Button>
            ))}
          </div>
        )}
        {marketPriceJpy != null && (
          <p className="text-meta">
            {t(lang, "mktPriceMarketPrice").replace("{n}", marketPriceJpy.toLocaleString())}
            {marketPriceThb != null && ` (~฿${marketPriceThb.toLocaleString()})`}
          </p>
        )}
        {diffPct != null && (
          <Badge
            variant={
              diffPct <= -10
                ? "default"
                : diffPct >= 15
                  ? "destructive"
                  : "secondary"
            }
          >
            {diffPct > 0 ? "+" : ""}
            {diffPct.toFixed(0)}% {diffPct <= -10 ? t(lang, "mktPriceCheaperThanMarket") : diffPct >= 15 ? t(lang, "mktPricePricierThanMarket") : t(lang, "mktPriceVsMarket")}
          </Badge>
        )}
      </div>

      {/* Quantity */}
      <div className="space-y-2">
        <label className="text-label">{t(lang, "mktPriceQuantityLabel")}</label>
        <Input
          type="number"
          min={1}
          max={999}
          step={1}
          value={data.quantity}
          onChange={(e) => update({ quantity: parseInt(e.target.value, 10) || 1 })}
          className="w-24"
        />
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-1">
          <ChevronLeft className="size-4" />
          {t(lang, "mktPriceBack")}
        </Button>
        <Button onClick={onNext} disabled={!isValid} className="gap-1">
          {t(lang, "mktPriceNext")}
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
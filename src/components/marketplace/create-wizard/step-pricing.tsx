"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CONDITIONS = ["NM", "LP", "MP", "HP", "DMG"] as const;

const CONDITION_LABELS: Record<string, string> = {
  NM: "Near Mint — สภาพใหม่มาก",
  LP: "Lightly Played — มีรอยเล็กน้อย",
  MP: "Moderately Played — มีรอยปานกลาง",
  HP: "Heavily Played — มีรอยมาก",
  DMG: "Damaged — เสียหาย",
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
  const update = (partial: Partial<PricingData>) =>
    onChange({ ...data, ...partial });

  const quickPrices = marketPriceJpy
    ? [
        { label: "-10%", value: Math.round(marketPriceJpy * 0.9) },
        { label: "ราคาตลาด", value: marketPriceJpy },
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
        <h2 className="text-h3">ราคาและสภาพ</h2>
        <p className="text-sm text-muted-foreground">
          ตั้งราคาขายและระบุสภาพการ์ด
        </p>
      </div>

      {/* Condition */}
      <div className="space-y-2">
        <label className="text-sm font-medium">สภาพการ์ด</label>
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
            {CONDITION_LABELS[data.condition]}
          </p>
        )}
      </div>

      {/* Price */}
      <div className="space-y-2">
        <label className="text-sm font-medium">ราคาขาย (JPY)</label>
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
            ราคาตลาด: ¥{marketPriceJpy.toLocaleString()}
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
            {diffPct.toFixed(0)}% {diffPct <= -10 ? "ถูกกว่าตลาด" : diffPct >= 15 ? "แพงกว่าตลาด" : "vs ตลาด"}
          </Badge>
        )}
      </div>

      {/* Quantity */}
      <div className="space-y-2">
        <label className="text-sm font-medium">จำนวน</label>
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
          กลับ
        </Button>
        <Button onClick={onNext} disabled={!isValid} className="gap-1">
          ถัดไป
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useUIStore } from "@/stores/ui-store";

const CURRENCY_LABEL = { THB: "฿", JPY: "¥", USD: "$" } as const;

export function CurrencyToggle() {
  const currency = useUIStore((s) => s.currency);
  const cycle = useUIStore((s) => s.cycleCurrency);

  return (
    <button
      type="button"
      onClick={cycle}
      className="flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      title={`Currency: ${currency}`}
    >
      <span className="font-price">{CURRENCY_LABEL[currency]}</span>
      <span>{currency}</span>
    </button>
  );
}

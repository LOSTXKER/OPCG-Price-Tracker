"use client";

import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui-store";

export function CurrencyToggle() {
  const currency = useUIStore((s) => s.currency);
  const toggleCurrency = useUIStore((s) => s.toggleCurrency);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="min-w-14 border-border bg-card font-mono text-foreground tabular-nums hover:bg-surface-elevated"
      onClick={() => toggleCurrency()}
      aria-label={
        currency === "JPY"
          ? "Switch currency to Thai Baht"
          : "Switch currency to Japanese Yen"
      }
    >
      {currency === "JPY" ? "¥" : "฿"}
    </Button>
  );
}

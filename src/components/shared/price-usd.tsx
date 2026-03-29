"use client";

import { formatUsdByCurrency } from "@/lib/utils/currency";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

export function PriceUsd({
  usd,
  className,
}: {
  usd: number;
  className?: string;
}) {
  const currency = useUIStore((s) => s.currency);
  const { primary } = formatUsdByCurrency(usd, currency);

  return <span className={cn("font-price", className)}>{primary}</span>;
}

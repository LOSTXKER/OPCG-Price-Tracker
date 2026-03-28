"use client";

import { formatByCurrency } from "@/lib/utils/currency";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

export function Price({
  jpy,
  thb,
  className,
}: {
  jpy: number;
  thb?: number | null;
  className?: string;
}) {
  const currency = useUIStore((s) => s.currency);
  const { primary } = formatByCurrency(jpy, currency, thb);

  return <span className={cn("font-price", className)}>{primary}</span>;
}

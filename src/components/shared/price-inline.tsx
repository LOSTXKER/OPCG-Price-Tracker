"use client";

import { formatByCurrency } from "@/lib/utils/currency";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

export function Price({
  jpy,
  className,
}: {
  jpy: number;
  className?: string;
}) {
  const currency = useUIStore((s) => s.currency);
  const { primary } = formatByCurrency(jpy, currency);

  return <span className={cn("font-price", className)}>{primary}</span>;
}

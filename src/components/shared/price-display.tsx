"use client";

import { formatByCurrency, formatPct } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

const sizeClasses = {
  sm: {
    primary: "text-sm font-medium",
    change: "text-xs",
  },
  md: {
    primary: "text-xl font-semibold",
    change: "text-sm",
  },
  lg: {
    primary: "text-3xl font-semibold",
    change: "text-base",
  },
} as const;

export type PriceDisplayProps = {
  priceJpy?: number | null;
  priceThb?: number | null;
  change?: number | null;
  size?: keyof typeof sizeClasses;
  showChange?: boolean;
  className?: string;
};

export function PriceDisplay({
  priceJpy,
  priceThb,
  change,
  size = "md",
  showChange = true,
  className,
}: PriceDisplayProps) {
  const currency = useUIStore((state) => state.currency);
  const s = sizeClasses[size];

  if (priceJpy == null || Number.isNaN(priceJpy)) {
    return (
      <div className={cn("font-price text-muted-foreground", s.primary, className)}>—</div>
    );
  }

  const { primary } = formatByCurrency(priceJpy, currency, priceThb);

  const changeNum = change ?? undefined;
  const hasChange = changeNum !== undefined && !Number.isNaN(changeNum) && showChange;
  const up = hasChange && changeNum! > 0;
  const down = hasChange && changeNum! < 0;

  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <span className={cn("font-price tracking-tight", s.primary)}>
        {primary}
      </span>
      {hasChange && (
        <span
          className={cn(
            "font-price rounded-md px-1 py-0.5",
            s.change,
            up && "bg-price-up/10 text-price-up",
            down && "bg-price-down/10 text-price-down",
            !up && !down && "text-muted-foreground"
          )}
        >
          {changeNum! > 0 ? "+" : ""}{formatPct(changeNum!)}%
        </span>
      )}
    </div>
  );
}

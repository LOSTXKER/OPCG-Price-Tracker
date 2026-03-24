"use client";

import { formatJpy, formatThb, formatUsd, jpyToThb, jpyToUsd } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import { useUIStore, type Currency } from "@/stores/ui-store";

const sizeClasses = {
  sm: {
    primary: "text-sm font-medium",
    secondary: "text-xs text-muted-foreground",
    change: "text-xs",
  },
  md: {
    primary: "text-xl font-semibold",
    secondary: "text-sm text-muted-foreground",
    change: "text-sm",
  },
  lg: {
    primary: "text-3xl font-semibold",
    secondary: "text-base text-muted-foreground",
    change: "text-base",
  },
} as const;

function formatByCurrency(jpy: number, currency: Currency, thbExplicit?: number | null): { primary: string; secondary: string } {
  const thb = thbExplicit != null ? Number(thbExplicit) : jpyToThb(jpy);
  const usd = jpyToUsd(jpy);
  const approx = thbExplicit == null;

  switch (currency) {
    case "THB":
      return { primary: approx ? `~${formatThb(Math.round(thb))}` : formatThb(Math.round(thb)), secondary: formatJpy(jpy) };
    case "USD":
      return { primary: formatUsd(usd), secondary: formatJpy(jpy) };
    case "JPY":
    default:
      return { primary: formatJpy(jpy), secondary: approx ? `~${formatThb(Math.round(thb))}` : formatThb(Math.round(thb)) };
  }
}

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

  const { primary, secondary } = formatByCurrency(priceJpy, currency, priceThb);

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
            "font-price",
            s.change,
            up && "text-price-up",
            down && "text-price-down",
            !up && !down && "text-muted-foreground"
          )}
        >
          {changeNum! > 0 ? "+" : ""}{changeNum!.toFixed(1)}%
        </span>
      )}
    </div>
  );
}

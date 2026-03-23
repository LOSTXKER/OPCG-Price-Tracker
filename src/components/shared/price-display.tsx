"use client";

import { TrendingDown, TrendingUp } from "lucide-react";

import { jpyToThb } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

const sizeClasses = {
  sm: {
    primary: "text-base font-semibold",
    secondary: "text-xs text-muted-foreground",
    change: "text-xs",
    icon: "size-3.5",
  },
  md: {
    primary: "text-xl font-semibold",
    secondary: "text-sm text-muted-foreground",
    change: "text-sm",
    icon: "size-4",
  },
  lg: {
    primary: "text-2xl font-bold",
    secondary: "text-base text-muted-foreground",
    change: "text-base",
    icon: "size-5",
  },
} as const;

function formatJpy(amount: number): string {
  return `¥${Math.round(amount).toLocaleString()}`;
}

function formatThbLine(amount: number, approximate: boolean): string {
  const n = Math.round(amount);
  const body = `${n.toLocaleString()} ฿`;
  return approximate ? `~${body}` : body;
}

export type PriceDisplayProps = {
  priceJpy?: number | null;
  priceThb?: number | null;
  change?: number | null;
  size?: keyof typeof sizeClasses;
  showChange?: boolean;
  rate?: number;
  className?: string;
};

export function PriceDisplay({
  priceJpy,
  priceThb,
  change,
  size = "md",
  showChange = true,
  rate,
  className,
}: PriceDisplayProps) {
  const currency = useUIStore((state) => state.currency);
  const pj = priceJpy;
  const pt = priceThb;
  const s = sizeClasses[size];

  if (pj == null || Number.isNaN(pj)) {
    return (
      <div
        className={cn(
          "font-mono text-muted-foreground tabular-nums",
          s.primary,
          className
        )}
        aria-label="ไม่มีข้อมูลราคา"
      >
        —
      </div>
    );
  }

  const changeNum = change ?? undefined;
  const hasChange =
    changeNum !== undefined && !Number.isNaN(changeNum) && showChange;
  const up = hasChange && changeNum! > 0;
  const down = hasChange && changeNum! < 0;
  const flat = hasChange && changeNum === 0;

  const thbExplicit = pt != null;
  const thbValue = thbExplicit ? Number(pt) : jpyToThb(pj, rate);

  const primaryIsJpy = currency === "JPY";
  const primaryText = primaryIsJpy
    ? formatJpy(pj)
    : formatThbLine(thbValue, !thbExplicit);
  const secondaryText = primaryIsJpy
    ? formatThbLine(thbValue, !thbExplicit)
    : formatJpy(pj);

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className={cn("font-mono tabular-nums tracking-tight", s.primary)}>
          {primaryText}
        </span>
        {hasChange && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-mono font-medium tabular-nums",
              s.change,
              up && "text-price-up",
              down && "text-price-down",
              flat && "text-muted-foreground"
            )}
          >
            {up && <TrendingUp className={s.icon} aria-hidden />}
            {down && <TrendingDown className={s.icon} aria-hidden />}
            <span>
              {up && "▲"}
              {down && "▼"}
              {`${changeNum! > 0 ? "+" : ""}${changeNum!.toFixed(1)}%`}
            </span>
          </span>
        )}
      </div>
      <span className={cn("font-mono tabular-nums", s.secondary)}>
        {secondaryText}
      </span>
    </div>
  );
}

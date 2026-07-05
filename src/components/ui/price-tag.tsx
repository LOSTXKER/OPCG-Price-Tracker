"use client";

import { ArrowDown, ArrowUp, Minus } from "lucide-react";

import { formatByCurrency, formatSignedPct } from "@/lib/utils/currency";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

const PRICE_SIZE = {
  sm: "text-sm font-medium",
  card: "text-lg font-semibold",
  md: "text-xl font-semibold",
  lg: "text-3xl font-semibold",
} as const;

const CHANGE_SIZE = {
  sm: "text-xs",
  card: "text-xs",
  md: "text-sm",
  lg: "text-base",
} as const;

const ARROW_SIZE = {
  sm: "size-3",
  card: "size-3",
  md: "size-3.5",
  lg: "size-4",
} as const;

type Size = keyof typeof PRICE_SIZE;

export type PriceTagProps = {
  /** Price in JPY (base). Omit for a change-only tag. */
  jpy?: number | null;
  /** Optional THB override for the display currency. */
  thb?: number | null;
  /** Signed %-change. Sign drives color (--price-up / --price-down). */
  change?: number | null;
  /** Render ONLY the change indicator (no price). */
  changeOnly?: boolean;
  /** Change indicator style — soft chip (bg) or plain colored text. Default "chip". */
  changeStyle?: "chip" | "plain";
  /** Show the change indicator alongside the price. Default true. */
  showChange?: boolean;
  /** Show the ▲/▼ arrow. Default true. */
  showArrow?: boolean;
  /** Reverse polarity (buyer view: a price drop reads "good"/green). */
  invert?: boolean;
  /** Decimal places for the %-change. Default 1. */
  decimals?: number;
  /** Label rendered when a change-only tag has no value. Default "—". */
  emptyLabel?: string;
  size?: Size;
  className?: string;
};

/**
 * PriceTag — the ONE money atom (see AGENTS.md · Component Kit). Renders a price
 * and/or a signed %-change indicator, always on the `--price-up` / `--price-down`
 * tokens. Replaces DeltaText, ChangePill, the chip in PriceDisplay, the grade
 * `Delta`, and alert `DirectionPill`.
 *
 * - Price + change:  `<PriceTag jpy={p} thb={t} change={c} size="md" />`
 * - Change only:     `<PriceTag change={c} changeOnly changeStyle="plain" />`
 */
export function PriceTag({
  jpy,
  thb,
  change,
  changeOnly = false,
  changeStyle = "chip",
  showChange = true,
  showArrow = true,
  invert = false,
  decimals = 1,
  emptyLabel = "—",
  size = "md",
  className,
}: PriceTagProps) {
  const currency = useUIStore((s) => s.currency);

  const hasChange =
    change != null && !Number.isNaN(change);
  const flat = hasChange && Math.abs(change!) < 0.005;
  const positive = hasChange && change! > 0;
  // Arrow follows the raw direction; color follows "good/bad" (invert flips it).
  const good = invert ? !positive : positive;
  const tone = !hasChange
    ? "text-muted-foreground/40" // null / no data — de-emphasized (matches old ChangePill)
    : flat
      ? "text-muted-foreground"
      : good
        ? "text-price-up"
        : "text-price-down";
  const Arrow = flat ? Minus : positive ? ArrowUp : ArrowDown;

  // Base classes for the change chip — the external `className` is applied at
  // the ROOT element (the chip when change-only, the wrapper div otherwise).
  const changeClasses = cn(
    "font-price inline-flex items-center gap-0.5 tabular-nums font-medium",
    CHANGE_SIZE[size],
    tone,
    changeStyle === "chip" && [
      "rounded-md px-1.5 py-0.5",
      !hasChange || flat ? "bg-muted/50" : good ? "bg-price-up/10" : "bg-price-down/10",
    ],
  );

  const changeInner = (
    <>
      {hasChange && showArrow && <Arrow className={ARROW_SIZE[size]} aria-hidden />}
      {hasChange && (
        <span className="sr-only">{flat ? "unchanged" : positive ? "up" : "down"}</span>
      )}
      {hasChange ? formatSignedPct(change, decimals) : emptyLabel}
    </>
  );

  // Change-only mode — just the indicator, no price/wrapper.
  if (changeOnly) return <span className={cn(changeClasses, className)}>{changeInner}</span>;

  if (jpy == null || Number.isNaN(jpy)) {
    return (
      <div className={cn("font-price text-muted-foreground", PRICE_SIZE[size], className)}>
        {emptyLabel}
      </div>
    );
  }

  const { primary } = formatByCurrency(jpy, currency, thb);

  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <span className={cn("font-price tracking-tight", PRICE_SIZE[size])}>{primary}</span>
      {showChange && hasChange && <span className={changeClasses}>{changeInner}</span>}
    </div>
  );
}

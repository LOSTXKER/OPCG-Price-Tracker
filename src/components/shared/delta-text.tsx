import { ArrowDown, ArrowUp, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

export interface DeltaTextProps {
  /** The percentage / numeric change. Sign drives color. */
  value: number | null | undefined;
  /** Suffix appended to the formatted number. Defaults to `%`. */
  suffix?: string;
  /** Number of decimal places. Defaults to 2 for `%`, 0 otherwise. */
  decimals?: number;
  /** Show an arrow icon left of the value. */
  showArrow?: boolean;
  /** Smaller, denser sizing for tables. */
  size?: "default" | "sm";
  /** Treat the wrapper as a chip (background + padding) — mirrors `Badge`. */
  asBadge?: boolean;
  /** Reverse polarity: positive = bad (e.g. price drops are good for buyers). */
  invert?: boolean;
  /** Override label when value is null/undefined. */
  emptyLabel?: string;
  className?: string;
}

/**
 * Unified +/- delta display.
 *
 * Replaces the bespoke `<span className="text-success">…</span>` and
 * `<span className="text-destructive">…</span>` patterns scattered across:
 *   - `card-table.tsx` `ChangeCell`
 *   - `trending-tabs.tsx` change column
 *   - `listing-card.tsx` vs-market line
 *
 * Always uses semantic tokens (`text-success` / `text-danger`) so theming
 * stays consistent.
 */
export function DeltaText({
  value,
  suffix = "%",
  decimals,
  showArrow = true,
  size = "default",
  asBadge = false,
  invert = false,
  emptyLabel = "—",
  className,
}: DeltaTextProps) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return <span className={cn("text-meta text-muted-foreground", className)}>{emptyLabel}</span>;
  }

  const isFlat = Math.abs(value) < 0.005;
  const positive = value > 0;
  const good = invert ? !positive : positive;

  const tone = isFlat
    ? "text-muted-foreground"
    : good
      ? "text-success"
      : "text-danger";

  const Icon = isFlat ? Minus : positive ? ArrowUp : ArrowDown;

  const formatted = (() => {
    const d = decimals ?? (suffix === "%" ? 2 : 0);
    const sign = positive ? "+" : "";
    return `${sign}${value.toFixed(d)}${suffix}`;
  })();

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium tabular-nums",
        tone,
        size === "sm" ? "text-xs" : "text-sm",
        asBadge && [
          "rounded-md px-1.5 py-0.5",
          isFlat
            ? "bg-muted/60"
            : good
              ? "bg-success-soft"
              : "bg-danger-soft",
        ],
        className,
      )}
    >
      {showArrow && <Icon className={cn(size === "sm" ? "size-3" : "size-3.5")} />}
      {formatted}
    </span>
  );
}

"use client";

import { useMemo } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatInteger } from "@/lib/utils/currency";
import type { CompareCard } from "@/hooks/use-compare-data";

export function SectionHeader({
  icon,
  label,
  colSpan,
}: {
  icon: React.ReactNode;
  label: string;
  colSpan: number;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="border-t border-border/60 px-4 pb-1 pt-4">
        <div className="flex items-center gap-2">
          <span className="flex size-5 items-center justify-center rounded-md bg-muted text-muted-foreground">
            {icon}
          </span>
          <span className="text-eyebrow">{label}</span>
        </div>
      </td>
    </tr>
  );
}

export function SpecRow<T extends CompareCard>({
  label,
  cards,
  children,
  showAddSlot,
  odd,
  highlight,
  getValue,
}: {
  label: string;
  cards: T[];
  children: (card: T, isHighlight: boolean) => React.ReactNode;
  showAddSlot: boolean;
  odd?: boolean;
  highlight?: "min" | "max";
  getValue?: (card: T) => number | null | undefined;
}) {
  const highlightIndices = useMemo(() => {
    if (!highlight || !getValue) return new Set<number>();
    const values = cards.map((c) => getValue(c) ?? null);
    const valid = values.filter((v): v is number => v != null);
    if (valid.length < 2) return new Set<number>();
    const target =
      highlight === "max" ? Math.max(...valid) : Math.min(...valid);
    const indices = new Set<number>();
    values.forEach((v, i) => {
      if (v === target) indices.add(i);
    });
    return indices;
  }, [cards, highlight, getValue]);

  return (
    <tr className={odd ? "bg-muted/20" : ""}>
      <td
        className="sticky left-0 z-10 w-[120px] px-4 py-2.5 text-xs font-medium text-muted-foreground md:w-[140px]"
        style={{ backgroundColor: "inherit" }}
      >
        {label}
      </td>
      {cards.map((card, i) => (
        <td key={card.cardCode} className="px-3 py-2.5 text-center">
          {children(card, highlightIndices.has(i))}
        </td>
      ))}
      {showAddSlot && <td />}
    </tr>
  );
}

export function NumericCell({
  value,
  highlight,
  format,
}: {
  value: number | null | undefined;
  highlight?: boolean;
  format?: boolean;
}) {
  if (value == null) {
    return <span className="text-meta text-muted-foreground/50">—</span>;
  }
  return (
    <span
      className={cn(
        "inline-block text-sm font-medium tabular-nums",
        highlight &&
          "rounded bg-primary/10 px-1.5 py-0.5 font-semibold text-primary",
      )}
    >
      {format ? formatInteger(value) : value}
    </span>
  );
}

export function ChangeChip({
  label,
  value,
}: {
  label: string;
  value: number | null | undefined;
}) {
  if (value == null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-meta">
        {label} —
      </span>
    );
  }
  const up = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
        up
          ? "bg-price-up/10 text-price-up"
          : "bg-destructive/10 text-destructive",
      )}
    >
      {up ? <ArrowUp className="size-2.5" /> : <ArrowDown className="size-2.5" />}
      {label} {Math.abs(value).toFixed(1)}%
    </span>
  );
}

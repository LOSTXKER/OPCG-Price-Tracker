"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useMemo } from "react";

import { cn } from "@/lib/utils";
import { formatInteger } from "@/lib/utils/currency";
import type { CompareCard } from "@/hooks/use-compare-data";

/**
 * Apple-style section: big heading on top with a hairline below, then a
 * stack of rows beneath. No panel/border chrome — relies on whitespace and
 * typography hierarchy alone.
 */
export function CompareSection({
  title,
  action,
  children,
  id,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <header className="mb-2 flex items-end justify-between gap-3 border-b border-[var(--p-hair)] pb-3 sm:pb-4">
        <h2 className="text-h2 sm:text-h1">{title}</h2>
        {action}
      </header>
      <div>{children}</div>
    </section>
  );
}

/**
 * Shared CSS variable name used by every grid on the compare page so columns
 * stay perfectly aligned across the rail and every section.
 *
 * Declare it once on the top-level compare wrapper:
 *   style={{ ["--compare-cols" as any]: `repeat(${n}, minmax(96px, 1fr))` }}
 *
 * Every grid below reads it via `var(--compare-cols)`.
 */
export const COMPARE_COLS_VAR = "--compare-cols";

/** Shared grid styles used by the rail, CompareRow, and CompareDetails.
 * `mx-auto` + `w-fit` centers the grid inside the section so a sparsely
 * filled tier (e.g. 1 card on a wide desktop) doesn't sit pinned to the
 * left. The grid never overflows the viewport — column widths are capped
 * by `--compare-cols` and shrink with `minmax(0, ...)` instead. */
const GRID_CLASS = "mx-auto grid w-full max-w-fit gap-3 sm:gap-6";

/**
 * One spec row. Each card gets its own cell with an eyebrow label on top and
 * the value underneath — the Apple Compare pattern. The label repeats per
 * column so eyes stay in a single card lane while reading down.
 */
export function CompareRow<T extends CompareCard>({
  label,
  cards,
  children,
  highlight,
  getValue,
  align = "center",
  placeholderCount = 0,
}: {
  label: string;
  cards: T[];
  children: (card: T, isWinner: boolean) => React.ReactNode;
  highlight?: "min" | "max";
  getValue?: (card: T) => number | null | undefined;
  /** Default `center` matches the `CardRail` slot alignment so every card's
   * value sits directly under its image and label. */
  align?: "center" | "start";
  /** Number of trailing empty cells to render after the real card cells. Each
   * placeholder keeps the label visible with a muted `—` in the value slot so
   * unfilled / add-slot lanes still show the row's schema. */
  placeholderCount?: number;
}) {
  const winners = useMemo(() => {
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

  const cellClass = cn(
    "flex flex-col gap-1.5 sm:gap-2",
    align === "center" ? "items-center text-center" : "items-start text-left",
  );

  return (
    <div
      className={cn(GRID_CLASS, "py-5 sm:py-10")}
      style={{ gridTemplateColumns: `var(${COMPARE_COLS_VAR})` }}
    >
      {cards.map((card, i) => (
        <div key={card.cardCode} className={cn(cellClass, "min-w-0")}>
          <p className="text-meta">{label}</p>
          <div className="w-full">{children(card, winners.has(i))}</div>
        </div>
      ))}
      {Array.from({ length: placeholderCount }, (_, i) => (
        <div key={`placeholder-${i}`} className={cn(cellClass, "min-w-0")}>
          <p className="text-meta">{label}</p>
          <div className="w-full">
            <span className="text-base text-muted-foreground/40 sm:text-2xl">
              —
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Big hero price number (Apple display size / price style). */
export function PriceCell({
  value,
  winner,
  formatter,
}: {
  value: number | null | undefined;
  winner?: boolean;
  formatter: (n: number) => string;
}) {
  if (value == null) {
    return <span className="text-xl text-muted-foreground/50 sm:text-2xl">—</span>;
  }
  return (
    <span
      className={cn(
        "block text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl md:text-4xl",
        winner && "text-price-up",
      )}
    >
      {formatter(value)}
    </span>
  );
}

/** Stat numbers: Power, Counter, Cost, Life. */
export function NumericCell({
  value,
  winner,
  format,
}: {
  value: number | null | undefined;
  winner?: boolean;
  format?: boolean;
}) {
  if (value == null) {
    return <span className="text-xl text-muted-foreground/50 sm:text-2xl">—</span>;
  }
  return (
    <span
      className={cn(
        "block text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl",
        winner && "text-price-up",
      )}
    >
      {format ? formatInteger(value) : value}
    </span>
  );
}

/** Inline change chip (arrow + percent). Used alone per row, not stacked. */
export function ChangeValue({
  value,
  winner,
}: {
  value: number | null | undefined;
  winner?: boolean;
}) {
  if (value == null) {
    return <span className="text-xl text-muted-foreground/50 sm:text-2xl">—</span>;
  }
  const up = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl",
        up ? "text-price-up" : "text-destructive",
      )}
    >
      {up ? (
        <ArrowUp className="size-5 sm:size-6" />
      ) : (
        <ArrowDown className="size-5 sm:size-6" />
      )}
      {Math.abs(value).toFixed(1)}%
      {winner ? <span className="sr-only">top mover</span> : null}
    </span>
  );
}

/** Text-style spec value (set, color, attribute, variant). */
export function TextValue({
  children,
  className,
  emphasis = "default",
}: {
  children: React.ReactNode;
  className?: string;
  emphasis?: "default" | "muted";
}) {
  return (
    <span
      className={cn(
        "inline-block max-w-full truncate text-base font-medium sm:text-lg",
        emphasis === "muted" && "text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Apple "SoC" pattern: each card becomes its own centered column of
 * label/value pairs stacked vertically. Best for text-heavy specs (set,
 * rarity, attribute, trait) that read nicer as a per-card dossier than as
 * row-by-row side-by-side.
 */
export function CompareDetails<T extends CompareCard>({
  cards,
  children,
  placeholderCount = 0,
  factLabels = [],
}: {
  cards: T[];
  children: (card: T) => React.ReactNode;
  /** Number of trailing empty columns to render (e.g. for the add-slot lane
   * or when the user has no cards selected yet). */
  placeholderCount?: number;
  /** Labels to render inside each empty column so the dossier schema is
   * visible even without a card. Should match the labels rendered by
   * `children` in the same order. */
  factLabels?: string[];
}) {
  return (
    <div
      className={cn(GRID_CLASS, "py-5 sm:py-10")}
      style={{ gridTemplateColumns: `var(${COMPARE_COLS_VAR})` }}
    >
      {cards.map((card) => (
        <div
          key={card.cardCode}
          className="flex min-w-0 flex-col items-center gap-4 text-center sm:gap-6"
        >
          {children(card)}
        </div>
      ))}
      {Array.from({ length: placeholderCount }, (_, i) => (
        <div
          key={`placeholder-${i}`}
          className="flex min-w-0 flex-col items-center gap-4 text-center sm:gap-6"
          aria-hidden
        >
          {factLabels.map((label) => (
            <CompareFact key={label} label={label}>
              <span className="text-base text-muted-foreground/40 sm:text-lg">
                —
              </span>
            </CompareFact>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Single label/value pair inside a `CompareDetails` column.
 * Eyebrow label sits above a single, prominent value. We keep the value
 * line on a single visual row when possible — long, multi-token values
 * (traits, etc.) should use `<TraitList>` so they wrap as a centered
 * stack instead of a slashy run-on. */
export function CompareFact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full flex-col items-center gap-1.5">
      <p className="text-eyebrow text-muted-foreground">{label}</p>
      <div className="flex w-full flex-col items-center text-base font-medium sm:text-lg">
        {children}
      </div>
    </div>
  );
}


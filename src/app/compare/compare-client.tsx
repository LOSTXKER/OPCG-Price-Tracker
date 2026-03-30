"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  ArrowDown,
  ArrowUp,
  ChartLine,
  Info,
  Lock,
  Plus,
  Scale,
  Swords,
  TrendingUp,
  X,
} from "lucide-react";
import { KumaEmptyState } from "@/components/kuma/kuma-empty-state";
import { RarityBadge } from "@/components/shared/rarity-badge";
import { CardPickerModal } from "@/components/compare/card-picker-modal";
import { useCompareStore } from "@/stores/compare-store";
import { useUIStore } from "@/stores/ui-store";
import { getCardName, t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { MAX_COMPARE } from "@/lib/constants/prices";
import { useCompareData, type CompareCard } from "@/hooks/use-compare-data";

const COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
];

export default function CompareClient() {
  const lang = useUIStore((s) => s.language);
  const storeItems = useCompareStore((s) => s.items);
  const removeFromStore = useCompareStore((s) => s.remove);
  const clearStore = useCompareStore((s) => s.clear);

  const [pickerOpen, setPickerOpen] = useState(false);

  const codes = useMemo(
    () => storeItems.map((i) => i.cardCode),
    [storeItems]
  );

  const {
    orderedCards,
    chartData,
    lowestPriceCode,
    days,
    setDays,
    loading,
    chartLocked,
    hasChart,
  } = useCompareData(codes);

  const showAddSlot = codes.length < MAX_COMPARE;
  const colSpan = orderedCards.length + 1 + (showAddSlot ? 1 : 0);

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Scale className="size-4" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {t(lang, "compareCards")}
        </h1>
        {codes.length > 0 && (
          <button
            onClick={clearStore}
            className="ml-auto text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {t(lang, "clearAll")}
          </button>
        )}
      </div>

      {/* ── Empty state ── */}
      {codes.length === 0 && !loading && (
        <KumaEmptyState
          title={t(lang, "compareEmpty")}
          description={t(lang, "compareEmptyDesc")}
          action={
            <button
              onClick={() => setPickerOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              <Plus className="size-4" />
              {t(lang, "addCardToCompare")}
            </button>
          }
        />
      )}

      {/* ── Unified Comparison Table ── */}
      {orderedCards.length > 0 && (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm" style={{ minWidth: `${120 + orderedCards.length * 160 + (showAddSlot ? 120 : 0)}px` }}>
            {/* Card Images Row */}
            <thead>
              <tr>
                <th className="sticky left-0 z-10 w-[120px] bg-card p-3 text-left text-xs font-medium text-muted-foreground md:w-[140px]">
                  {t(lang, "card")}
                </th>
                {orderedCards.map((card, i) => (
                  <th key={card.cardCode} className="p-3 text-center align-bottom">
                    <div className="flex flex-col items-center gap-2">
                      <div className="group relative">
                        <button
                          onClick={() => removeFromStore(card.cardCode)}
                          className="absolute -right-1.5 -top-1.5 z-10 flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm transition-opacity hover:bg-destructive/90"
                        >
                          <X className="size-3" />
                        </button>
                        <Link href={`/cards/${card.cardCode}`}>
                          <div className="relative mx-auto h-[140px] w-[100px] overflow-hidden rounded-lg border bg-muted shadow-sm transition-transform hover:scale-[1.03] md:h-[170px] md:w-[122px]">
                            {card.imageUrl ? (
                              <Image
                                src={card.imageUrl}
                                alt={getCardName(lang, card)}
                                fill
                                className="object-cover"
                                sizes="122px"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                                {card.cardCode}
                              </div>
                            )}
                          </div>
                        </Link>
                      </div>
                      <div className="flex flex-col items-center gap-0.5">
                        <span
                          className="size-2.5 rounded-full ring-2 ring-background"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        />
                        <p className="max-w-[120px] truncate text-xs font-medium">
                          {getCardName(lang, card)}
                        </p>
                        <p className="font-mono text-[10px] text-muted-foreground">
                          {card.cardCode}
                        </p>
                      </div>
                    </div>
                  </th>
                ))}
                {showAddSlot && (
                  <th className="p-3 text-center align-bottom">
                    <button
                      onClick={() => setPickerOpen(true)}
                      className="mx-auto flex h-[140px] w-[100px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/20 transition-colors hover:border-primary/40 hover:bg-primary/5 md:h-[170px] md:w-[122px]"
                    >
                      <Plus className="size-6 text-muted-foreground/40" />
                      <span className="text-[10px] font-medium text-muted-foreground/60">
                        {t(lang, "addCardToCompare")}
                      </span>
                    </button>
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {/* ── Price Section ── */}
              <SectionHeader
                icon={<TrendingUp className="size-3.5" />}
                label={t(lang, "comparePricing")}
                colSpan={colSpan}
              />
              <tr className="bg-muted/20">
                <td className="sticky left-0 z-10 w-[120px] px-4 py-3 text-xs font-medium text-muted-foreground md:w-[140px]" style={{ backgroundColor: "inherit" }}>
                  {t(lang, "price")}
                </td>
                {orderedCards.map((card) => {
                  const isLowest = card.cardCode === lowestPriceCode;
                  return (
                    <td key={card.cardCode} className="px-3 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {isLowest && (
                          <span className="rounded-full bg-price-up/10 px-2 py-0.5 text-[9px] font-semibold text-price-up">
                            {t(lang, "lowest")}
                          </span>
                        )}
                        <span
                          className={cn(
                            "text-base font-bold tabular-nums md:text-lg",
                            isLowest && "text-price-up"
                          )}
                        >
                          {card.currentPrice != null
                            ? `¥${card.currentPrice.toLocaleString()}`
                            : "—"}
                        </span>
                      </div>
                    </td>
                  );
                })}
                {showAddSlot && <td />}
              </tr>
              <tr>
                <td className="sticky left-0 z-10 w-[120px] px-4 py-2.5 text-xs font-medium text-muted-foreground md:w-[140px]" style={{ backgroundColor: "inherit" }}>
                  {t(lang, "change")}
                </td>
                {orderedCards.map((card) => (
                  <td key={card.cardCode} className="px-3 py-2.5 text-center">
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                      <ChangeChip label="7d" value={card.change7d} />
                      <ChangeChip label="30d" value={card.change30d} />
                    </div>
                  </td>
                ))}
                {showAddSlot && <td />}
              </tr>

              {/* ── Basic Info Section ── */}
              <SectionHeader
                icon={<Info className="size-3.5" />}
                label={t(lang, "compareBasicInfo")}
                colSpan={colSpan}
              />
              <SpecRow label={t(lang, "set")} cards={orderedCards} showAddSlot={showAddSlot} odd>
                {(card) => (
                  <span className="text-xs font-medium">{card.setCode?.toUpperCase()}</span>
                )}
              </SpecRow>
              <SpecRow label={t(lang, "rarity")} cards={orderedCards} showAddSlot={showAddSlot}>
                {(card) => <RarityBadge rarity={card.rarity} size="sm" />}
              </SpecRow>
              <SpecRow label={t(lang, "type")} cards={orderedCards} showAddSlot={showAddSlot} odd>
                {(card) => (
                  <span className="text-xs capitalize">{card.cardType?.toLowerCase()}</span>
                )}
              </SpecRow>
              <SpecRow label={t(lang, "color")} cards={orderedCards} showAddSlot={showAddSlot}>
                {(card) => <span className="text-xs">{card.color}</span>}
              </SpecRow>
              <SpecRow label={t(lang, "variant")} cards={orderedCards} showAddSlot={showAddSlot} odd>
                {(card) => (
                  <span className="text-xs">
                    {card.isParallel ? t(lang, "parallel") : t(lang, "regular")}
                  </span>
                )}
              </SpecRow>

              {/* ── Stats Section ── */}
              <SectionHeader
                icon={<Swords className="size-3.5" />}
                label={t(lang, "compareStats")}
                colSpan={colSpan}
              />
              <SpecRow label={t(lang, "cost")} cards={orderedCards} showAddSlot={showAddSlot}>
                {(card) => <NumericCell value={card.cost} />}
              </SpecRow>
              <SpecRow
                label={t(lang, "power")}
                cards={orderedCards}
                showAddSlot={showAddSlot}
                odd
                highlight="max"
                getValue={(c) => c.power}
              >
                {(card, hl) => (
                  <NumericCell value={card.power} highlight={hl} format />
                )}
              </SpecRow>
              <SpecRow
                label={t(lang, "counter")}
                cards={orderedCards}
                showAddSlot={showAddSlot}
                highlight="max"
                getValue={(c) => c.counter}
              >
                {(card, hl) => <NumericCell value={card.counter} highlight={hl} />}
              </SpecRow>
              <SpecRow label={t(lang, "life")} cards={orderedCards} showAddSlot={showAddSlot} odd>
                {(card) => <NumericCell value={card.life} />}
              </SpecRow>
              <SpecRow label={t(lang, "attribute")} cards={orderedCards} showAddSlot={showAddSlot}>
                {(card) => <span className="text-xs">{card.attribute ?? "—"}</span>}
              </SpecRow>
              <SpecRow label={t(lang, "trait")} cards={orderedCards} showAddSlot={showAddSlot} odd>
                {(card) => (
                  <span
                    className="inline-block max-w-[120px] truncate text-xs"
                    title={card.trait ?? undefined}
                  >
                    {card.trait ?? "—"}
                  </span>
                )}
              </SpecRow>
            </tbody>
          </table>
        </div>
      )}

      {/* ── Chart Panel ── */}
      {orderedCards.length > 0 && (hasChart || chartLocked) && (
        <div className="rounded-xl border bg-card">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <div className="flex size-6 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <ChartLine className="size-3.5" />
            </div>
            <h2 className="text-sm font-semibold">
              {t(lang, "comparePriceChart")}
            </h2>
            {hasChart && (
              <div className="ml-auto flex gap-0.5 rounded-lg bg-muted p-0.5">
                {[30, 90, 180, 365].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      days === d
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            )}
          </div>

          {hasChart && (
            <div className="p-4">
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  {orderedCards.map((card, i) => (
                    <Line
                      key={card.cardCode}
                      type="monotone"
                      dataKey={card.cardCode}
                      stroke={COLORS[i % COLORS.length]}
                      dot={false}
                      strokeWidth={2}
                      name={`${card.cardCode} ${getCardName(lang, card)}`}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {chartLocked && (
            <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
              <Lock className="size-8 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground/70">Pro</p>
              <Link
                href="/pricing"
                className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {t(lang, "subscribe")}
              </Link>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          {t(lang, "loading")}
        </div>
      )}

      <CardPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  );
}

/* ─── Sub-components ─── */

function SectionHeader({
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
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
        </div>
      </td>
    </tr>
  );
}

function SpecRow<T extends CompareCard>({
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

function NumericCell({
  value,
  highlight,
  format,
}: {
  value: number | null | undefined;
  highlight?: boolean;
  format?: boolean;
}) {
  if (value == null) {
    return <span className="text-xs text-muted-foreground/50">—</span>;
  }
  return (
    <span
      className={cn(
        "inline-block text-sm font-medium tabular-nums",
        highlight &&
          "rounded bg-blue-500/10 px-1.5 py-0.5 font-semibold text-blue-500"
      )}
    >
      {format ? value.toLocaleString() : value}
    </span>
  );
}

function ChangeChip({
  label,
  value,
}: {
  label: string;
  value: number | null | undefined;
}) {
  if (value == null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
        {label} —
      </span>
    );
  }
  const up = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums",
        up
          ? "bg-price-up/10 text-price-up"
          : "bg-destructive/10 text-destructive"
      )}
    >
      {up ? (
        <ArrowUp className="size-2.5" />
      ) : (
        <ArrowDown className="size-2.5" />
      )}
      {label} {Math.abs(value).toFixed(1)}%
    </span>
  );
}

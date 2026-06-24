"use client";

import { useId, useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getCardName, getLocale, t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";
import {
  compactDisplayValue,
  formatDisplayValue,
  type Currency,
} from "@/lib/utils/currency";

export interface CompareChartCard {
  cardCode: string;
  nameEn?: string | null;
  nameJp?: string | null;
  nameKo?: string | null;
  nameTh?: string | null;
  nameZh?: string | null;
}

function formatAxisDate(iso: string, locale: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale, { month: "short", day: "numeric" });
}

function formatTooltipDate(iso: string, locale: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function CompareTooltip({
  active,
  payload,
  label,
  cards,
  colors,
  formatPrice,
  locale,
  lang,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ dataKey?: string; value?: number }>;
  label?: string;
  cards: CompareChartCard[];
  colors: string[];
  formatPrice: (v: number) => string;
  locale: string;
  lang: ReturnType<typeof useUIStore.getState>["language"];
}) {
  if (!active || !payload?.length || !label) return null;

  const entries = cards
    .map((card, i) => {
      const entry = payload.find((p) => p.dataKey === card.cardCode);
      return {
        card,
        color: colors[i % colors.length],
        value: entry?.value ?? null,
      };
    })
    .filter((e) => e.value != null);

  if (entries.length === 0) return null;

  return (
    <div className="min-w-[200px] rounded-xl border border-[var(--p-hair)] bg-popover/95 px-3.5 py-2.5 shadow-xl backdrop-blur-sm">
      <p className="text-meta">{formatTooltipDate(label, locale)}</p>
      <div className="mt-1.5 space-y-1">
        {entries.map(({ card, color, value }) => (
          <div key={card.cardCode} className="flex items-center gap-2">
            <span
              className="inline-block size-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="min-w-0 flex-1 truncate text-meta">
              <span className="font-mono text-muted-foreground">
                {card.cardCode}
              </span>{" "}
              <span>{getCardName(lang, card)}</span>
            </span>
            <span
              className="shrink-0 font-price text-sm font-bold tabular-nums"
              style={{ color }}
            >
              {formatPrice(value as number)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CompareChart({
  chartData,
  cards,
  colors,
}: {
  chartData: Record<string, unknown>[];
  cards: CompareChartCard[];
  colors: string[];
}) {
  const lang = useUIStore((s) => s.language);
  const currency = useUIStore((s) => s.currency) as Currency;
  const locale = getLocale(lang);
  const chartId = useId().replace(/:/g, "");

  const fmtPrice = useMemo(
    () => (v: number) => formatDisplayValue(v, currency),
    [currency],
  );
  const fmtAxis = useMemo(
    () => (v: number) => compactDisplayValue(v, currency),
    [currency],
  );

  if (chartData.length === 0) {
    return (
      <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
        {t(lang, "noData")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Custom legend replaces recharts default for cleaner typography */}
      {cards.length > 1 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {cards.map((card, i) => (
            <div key={card.cardCode} className="flex items-center gap-1.5">
              <span
                className="inline-block size-2 rounded-full"
                style={{ backgroundColor: colors[i % colors.length] }}
              />
              <span className="font-mono text-meta text-muted-foreground">
                {card.cardCode}
              </span>
              <span className="text-meta">{getCardName(lang, card)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="w-full">
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart
            data={chartData}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <defs>
              {cards.map((card, i) => (
                <linearGradient
                  key={card.cardCode}
                  id={`cmp-grad-${chartId}-${card.cardCode}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={colors[i % colors.length]}
                    stopOpacity={0.18}
                  />
                  <stop
                    offset="100%"
                    stopColor={colors[i % colors.length]}
                    stopOpacity={0}
                  />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-border/30"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => formatAxisDate(v, locale)}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              className="text-muted-foreground"
              minTickGap={40}
              dy={8}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              className="font-mono text-muted-foreground"
              tickFormatter={(v) => fmtAxis(Number(v))}
              width={56}
              domain={[
                (dataMin: number) => Math.floor(dataMin * 0.97),
                (dataMax: number) => Math.ceil(dataMax * 1.03),
              ]}
            />
            <Tooltip
              cursor={{
                stroke: "var(--color-muted-foreground)",
                strokeDasharray: "3 3",
                strokeWidth: 1,
                opacity: 0.4,
              }}
              content={
                <CompareTooltip
                  cards={cards}
                  colors={colors}
                  formatPrice={fmtPrice}
                  locale={locale}
                  lang={lang}
                />
              }
            />
            {cards.map((card, i) => (
              <Area
                key={card.cardCode}
                type="monotone"
                dataKey={card.cardCode}
                stroke={colors[i % colors.length]}
                strokeWidth={2}
                fill={`url(#cmp-grad-${chartId}-${card.cardCode})`}
                dot={false}
                connectNulls
                activeDot={{
                  r: 4,
                  fill: colors[i % colors.length],
                  strokeWidth: 2,
                  stroke: "var(--color-background, #fff)",
                }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

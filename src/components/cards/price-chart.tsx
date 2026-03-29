"use client"

import { useId, useMemo } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Loader2, TrendingDown, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { compactDisplayValue, formatDisplayValue, formatPct, type Currency } from "@/lib/utils/currency"
import { useUIStore } from "@/stores/ui-store"
import { getLocale, t } from "@/lib/i18n"

const PERIODS = [
  { value: "24h", label: "24H" },
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
  { value: "1y", label: "1Y" },
  { value: "all", label: "All" },
]

export type ChartSeriesDef = {
  id: string
  label: string
  color: string
  dataKey: string
}

export type MergedChartRow = {
  scrapedAt: string
  [key: string]: number | string | undefined
}

export type ChartStats = {
  high: number
  low: number
  avg: number
  change: number
}

export interface PriceChartProps {
  mergedData: MergedChartRow[]
  series: ChartSeriesDef[]
  visibleSeries: Set<string>
  period: string
  onPeriodChange: (period: string) => void
  loading?: boolean
  stats?: ChartStats | null
}

function formatAxisDate(iso: string, locale: string, period?: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  if (period === "24h") {
    return d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })
  }
  if (period === "1y" || period === "all") {
    return d.toLocaleDateString(locale, { month: "short", year: "2-digit" })
  }
  return d.toLocaleDateString(locale, { month: "short", day: "numeric" })
}

function formatTooltipDate(iso: string, locale: string, period?: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  if (period === "24h") {
    return d.toLocaleString(locale, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }
  return d.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function MultiSeriesTooltip(props: {
  active?: boolean
  payload?: ReadonlyArray<{ dataKey?: string; value?: number; color?: string }>
  label?: string
  series: ChartSeriesDef[]
  visibleSeries: Set<string>
  formatPrice: (v: number) => string
  period?: string
  locale?: string
}) {
  const { active, payload, label, series, visibleSeries, formatPrice, period, locale = "en-US" } = props
  if (!active || !payload?.length || !label) return null

  const visibleEntries = series.filter((s) => visibleSeries.has(s.id))

  if (visibleEntries.length === 1) {
    const s = visibleEntries[0]
    const entry = payload.find((p) => p.dataKey === s.dataKey)
    if (!entry?.value) return null
    return (
      <div className="rounded-xl border border-border/50 bg-popover/95 px-3.5 py-2.5 shadow-xl backdrop-blur-sm">
        <p className="text-[10px] text-muted-foreground">
          {formatTooltipDate(label, locale, period)}
        </p>
        <p className="mt-1 font-price text-sm font-bold tabular-nums" style={{ color: s.color }}>
          {formatPrice(entry.value)}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border/50 bg-popover/95 px-3.5 py-2.5 shadow-xl backdrop-blur-sm">
      <p className="text-[10px] text-muted-foreground">
        {formatTooltipDate(label, locale, period)}
      </p>
      <div className="mt-1.5 space-y-1">
        {visibleEntries.map((s) => {
          const entry = payload.find((p) => p.dataKey === s.dataKey)
          const value = entry?.value
          if (value == null) return null
          return (
            <div key={s.id} className="flex items-center gap-2">
              <span
                className="inline-block size-2 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-[10px] text-muted-foreground">{s.label}</span>
              <span className="ml-auto font-price text-sm font-bold tabular-nums" style={{ color: s.color }}>
                {formatPrice(value)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function PriceChart({
  mergedData,
  series,
  visibleSeries,
  period,
  onPeriodChange,
  loading,
  stats,
}: PriceChartProps) {
  const displayCurrency = useUIStore((s) => s.currency) as Currency
  const lang = useUIStore((s) => s.language)
  const locale = getLocale(lang)
  const chartId = useId().replace(/:/g, "")

  const visibleSeriesDefs = useMemo(
    () => series.filter((s) => visibleSeries.has(s.id)),
    [series, visibleSeries],
  )

  const fmtPrice = useMemo(
    () => (v: number) => formatDisplayValue(v, displayCurrency),
    [displayCurrency],
  )

  const fmtAxis = useMemo(
    () => (v: number) => compactDisplayValue(v, displayCurrency),
    [displayCurrency],
  )

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => onPeriodChange(p.value)}
              disabled={loading}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                period === p.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        {loading && (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-4 gap-px overflow-hidden rounded-lg bg-border/30">
          <div className="bg-background px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">High</p>
            <p className="mt-0.5 font-price text-sm font-bold tabular-nums text-price-up">
              {fmtPrice(stats.high)}
            </p>
          </div>
          <div className="bg-background px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Low</p>
            <p className="mt-0.5 font-price text-sm font-bold tabular-nums text-price-down">
              {fmtPrice(stats.low)}
            </p>
          </div>
          <div className="bg-background px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Avg</p>
            <p className="mt-0.5 font-price text-sm font-bold tabular-nums text-foreground">
              {fmtPrice(stats.avg)}
            </p>
          </div>
          <div className="bg-background px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Change</p>
            <p className={cn(
              "mt-0.5 flex items-center gap-1 font-price text-sm font-bold tabular-nums",
              stats.change >= 0 ? "text-price-up" : "text-price-down",
            )}>
              {stats.change >= 0
                ? <TrendingUp className="size-3" />
                : <TrendingDown className="size-3" />
              }
              {stats.change >= 0 ? "+" : ""}{formatPct(stats.change)}%
            </p>
          </div>
        </div>
      )}

      {/* Legend (only when multiple series) */}
      {visibleSeriesDefs.length > 1 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {visibleSeriesDefs.map((s) => (
            <div key={s.id} className="flex items-center gap-1.5">
              <span
                className="inline-block size-2 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-[11px] text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Chart area */}
      <div
        className={cn(
          "min-h-[300px] w-full transition-opacity duration-300",
          loading && "pointer-events-none opacity-40",
        )}
      >
        {mergedData.length > 0 && visibleSeriesDefs.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={mergedData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                {visibleSeriesDefs.map((s) => (
                  <linearGradient
                    key={s.id}
                    id={`grad-${chartId}-${s.id}`}
                    x1="0" y1="0" x2="0" y2="1"
                  >
                    <stop offset="0%" stopColor={s.color} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border/30"
                vertical={false}
              />
              <XAxis
                dataKey="scrapedAt"
                tickFormatter={(v) => formatAxisDate(v, locale, period)}
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
                className="text-muted-foreground font-mono"
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
                  <MultiSeriesTooltip
                    series={series}
                    visibleSeries={visibleSeries}
                    formatPrice={fmtPrice}
                    period={period}
                    locale={locale}
                  />
                }
              />
              {visibleSeriesDefs.map((s) => (
                <Area
                  key={s.id}
                  type="monotone"
                  dataKey={s.dataKey}
                  stroke={s.color}
                  strokeWidth={2}
                  fill={`url(#grad-${chartId}-${s.id})`}
                  dot={false}
                  connectNulls
                  activeDot={{
                    r: 4,
                    fill: s.color,
                    strokeWidth: 2,
                    stroke: "var(--color-background, #fff)",
                  }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            {t(lang, "noData")}
          </div>
        )}
      </div>
    </div>
  )
}

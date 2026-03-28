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
import { formatByCurrency, jpyToThb, jpyToUsd } from "@/lib/utils/currency"
import { useUIStore } from "@/stores/ui-store"

function getCssVar(name: string, fallback: string) {
  if (typeof document === "undefined") return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

function getChartColors() {
  return {
    up: getCssVar("--price-up", "#34C759"),
    down: getCssVar("--price-down", "#FF3B30"),
  }
}

const PERIODS = [
  { value: "24h", label: "24H" },
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
  { value: "1y", label: "1Y" },
  { value: "all", label: "All" },
]

export interface PriceChartStats {
  high: number
  low: number
  avg: number
}

export interface PriceChartProps {
  data: {
    scrapedAt: string
    priceJpy: number | null
    priceThb?: number | null
    source?: string
  }[]
  period: string
  onPeriodChange: (period: string) => void
  stats?: PriceChartStats | null
  loading?: boolean
}

function formatAxisDate(iso: string, period?: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  if (period === "24h") {
    return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })
  }
  if (period === "1y" || period === "all") {
    return d.toLocaleDateString("th-TH", { month: "short", year: "2-digit" })
  }
  return d.toLocaleDateString("th-TH", { month: "short", day: "numeric" })
}

function formatTooltipDate(iso: string, period?: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  if (period === "24h") {
    return d.toLocaleString("th-TH", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }
  return d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatPriceByCurrency(jpy: number, currency: string): string {
  return formatByCurrency(jpy, currency as "JPY" | "THB" | "USD").primary
}

function compactPrice(jpy: number, currency: string): string {
  const c = currency as "JPY" | "THB" | "USD"
  let value: number
  let prefix: string
  let suffix: string

  switch (c) {
    case "THB":
      value = jpyToThb(jpy)
      prefix = "~"
      suffix = " ฿"
      break
    case "USD":
      value = jpyToUsd(jpy)
      prefix = "$"
      suffix = ""
      break
    default:
      value = jpy
      prefix = "¥"
      suffix = ""
  }

  if (value >= 1_000_000) return `${prefix}${(value / 1_000_000).toFixed(1)}M${suffix}`
  if (value >= 1_000) return `${prefix}${Math.round(value / 1_000)}K${suffix}`
  return `${prefix}${Math.round(value)}${suffix}`
}

type ChartRow = {
  scrapedAt: string
  priceJpy: number
  priceThb?: number | null
  source?: string
}

function ChartTooltip(props: {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: ChartRow }>
  currency?: string
  lineColor?: string
  period?: string
}) {
  const { active, payload, currency = "JPY", lineColor, period } = props
  if (!active || !payload?.length) return null
  const row = payload[0].payload as ChartRow | undefined
  if (!row) return null
  return (
    <div className="rounded-xl border border-border/50 bg-popover/95 px-3.5 py-2.5 shadow-xl backdrop-blur-sm">
      <p className="text-[10px] text-muted-foreground">
        {formatTooltipDate(row.scrapedAt, period)}
      </p>
      <p
        className="mt-1 font-price text-base font-bold"
        style={{ color: lineColor }}
      >
        {formatPriceByCurrency(row.priceJpy, currency)}
      </p>
      {row.source && (
        <p className="mt-0.5 text-[10px] text-muted-foreground/50">
          {row.source}
        </p>
      )}
    </div>
  )
}

export function PriceChart({
  data,
  period,
  onPeriodChange,
  stats,
  loading,
}: PriceChartProps) {
  const currency = useUIStore((s) => s.currency)
  const chartId = useId().replace(/:/g, "")
  const gradientId = `priceGrad-${chartId}`

  const chartData = useMemo<ChartRow[]>(
    () =>
      [...data]
        .filter((d) => d.priceJpy != null)
        .map((d) => ({
          scrapedAt: d.scrapedAt,
          priceJpy: d.priceJpy!,
          priceThb: d.priceThb,
          source: d.source,
        }))
        .sort(
          (a, b) =>
            new Date(a.scrapedAt).getTime() - new Date(b.scrapedAt).getTime(),
        ),
    [data],
  )

  const { lineColor, isUp, change } = useMemo(() => {
    const colors = getChartColors()
    if (chartData.length < 2)
      return { lineColor: colors.up, isUp: true, change: 0 }
    const first = chartData[0].priceJpy
    const last = chartData[chartData.length - 1].priceJpy
    const up = last >= first
    const chg = first > 0 ? ((last - first) / first) * 100 : 0
    return { lineColor: up ? colors.up : colors.down, isUp: up, change: chg }
  }, [chartData])

  const lastPrice = chartData.length > 0
    ? chartData[chartData.length - 1].priceJpy
    : 0

  return (
    <div className="space-y-4">
      {/* Period selector + loading indicator */}
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
      {stats && stats.high > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            <div className="rounded-lg bg-muted/30 px-2.5 py-2">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                High
              </p>
              <p className="mt-0.5 font-price text-sm font-bold tabular-nums text-price-up">
                {formatPriceByCurrency(stats.high, currency)}
              </p>
            </div>
            <div className="rounded-lg bg-muted/30 px-2.5 py-2">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                Low
              </p>
              <p className="mt-0.5 font-price text-sm font-bold tabular-nums text-price-down">
                {formatPriceByCurrency(stats.low, currency)}
              </p>
            </div>
            <div className="rounded-lg bg-muted/30 px-2.5 py-2">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                Avg
              </p>
              <p className="mt-0.5 font-price text-sm font-bold tabular-nums">
                {formatPriceByCurrency(stats.avg, currency)}
              </p>
            </div>
            <div className="rounded-lg bg-muted/30 px-2.5 py-2">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                Change
              </p>
              <p
                className="mt-0.5 flex items-center gap-0.5 font-price text-sm font-bold tabular-nums"
                style={{
                  color: isUp ? "var(--price-up)" : change < 0 ? "var(--price-down)" : undefined,
                }}
              >
                {isUp && change !== 0 ? (
                  <TrendingUp className="size-3" />
                ) : change < 0 ? (
                  <TrendingDown className="size-3" />
                ) : null}
                {change > 0 ? "+" : ""}
                {change.toFixed(1)}%
              </p>
            </div>
          </div>

        </div>
      )}

      {/* Chart area */}
      <div
        className={cn(
          "min-h-[300px] w-full transition-opacity duration-300",
          loading && "pointer-events-none opacity-40",
        )}
      >
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={chartData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={lineColor} stopOpacity={0.2} />
                  <stop
                    offset="100%"
                    stopColor={lineColor}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border/30"
                vertical={false}
              />
              <XAxis
                dataKey="scrapedAt"
                tickFormatter={(v) => formatAxisDate(v, period)}
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
                tickFormatter={(v) => compactPrice(Number(v), currency)}
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
                  <ChartTooltip currency={currency} lineColor={lineColor} period={period} />
                }
              />
              <Area
                type="monotone"
                dataKey="priceJpy"
                stroke={lineColor}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={{
                  r: 5,
                  fill: lineColor,
                  strokeWidth: 2,
                  stroke: "var(--color-background, #fff)",
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            ไม่มีข้อมูลราคาสำหรับช่วงเวลานี้
          </div>
        )}
      </div>
    </div>
  )
}

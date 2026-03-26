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
import { Lock } from "lucide-react"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatByCurrency, formatJpy, jpyToThb, jpyToUsd } from "@/lib/utils/currency"
import { useUIStore } from "@/stores/ui-store"

const LINE_COLOR = "#3B82F6"

const PERIODS: { value: string; label: string; locked: boolean }[] = [
  { value: "7d", label: "7d", locked: false },
  { value: "30d", label: "30d", locked: false },
  { value: "90d", label: "90d", locked: true },
  { value: "1y", label: "1y", locked: true },
  { value: "all", label: "All", locked: true },
]

export interface PriceChartProps {
  data: { scrapedAt: string; priceJpy: number | null; priceThb?: number | null; source?: string }[]
  period: string
  onPeriodChange: (period: string) => void
}

function formatAxisDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString("th-TH", { month: "short", day: "numeric" })
}

function formatTooltipDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

type ChartTooltipRow = {
  scrapedAt: string
  priceJpy: number
  priceThb?: number | null
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

function ChartTooltip(props: {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: ChartTooltipRow }>
  currency?: string
}) {
  const { active, payload, currency = "JPY" } = props
  if (!active || !payload?.length) return null
  const row = payload[0].payload as ChartTooltipRow | undefined
  if (!row) return null
  return (
    <div className="bg-popover text-popover-foreground rounded-lg border px-3 py-2 text-xs shadow-md">
      <p className="text-muted-foreground mb-1.5 font-medium">
        {formatTooltipDate(row.scrapedAt)}
      </p>
      <p className="font-mono font-semibold">
        {formatPriceByCurrency(row.priceJpy, currency)}
      </p>
      {currency !== "JPY" && (
        <p className="text-muted-foreground font-mono">
          {formatJpy(row.priceJpy)}
        </p>
      )}
    </div>
  )
}

export function PriceChart({ data, period, onPeriodChange }: PriceChartProps) {
  const currency = useUIStore((s) => s.currency)
  const chartId = useId().replace(/:/g, "")
  const gradientId = `priceArea-${chartId}`

  const chartData = useMemo(
    () =>
      [...data]
        .map((d) => ({
          scrapedAt: d.scrapedAt,
          priceJpy: d.priceJpy,
          priceThb: d.priceThb,
        }))
        .sort(
          (a, b) =>
            new Date(a.scrapedAt).getTime() - new Date(b.scrapedAt).getTime()
        ),
    [data]
  )

  return (
    <div className="space-y-4">
      <Tabs
        value={period}
        onValueChange={(next) => onPeriodChange(String(next))}
      >
        <TabsList variant="line" className="h-auto w-full flex-wrap justify-start gap-1">
          {PERIODS.map((p) => (
            <TabsTrigger key={p.value} value={p.value} className="gap-1 px-2.5">
              {p.label}
              {p.locked ? (
                <Lock className="size-3.5 shrink-0 opacity-70" aria-hidden />
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="min-h-[280px] w-full">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart
            data={chartData}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={LINE_COLOR} stopOpacity={0.35} />
                <stop offset="95%" stopColor={LINE_COLOR} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="4 4"
              className="stroke-border/60"
              vertical={false}
            />
            <XAxis
              dataKey="scrapedAt"
              tickFormatter={formatAxisDate}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              className="text-muted-foreground"
              minTickGap={24}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              className="text-muted-foreground font-mono"
              tickFormatter={(v) => compactPrice(Number(v), currency)}
              width={64}
            />
            <Tooltip content={<ChartTooltip currency={currency} />} />
            <Area
              type="monotone"
              dataKey="priceJpy"
              stroke={LINE_COLOR}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 4, fill: LINE_COLOR }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

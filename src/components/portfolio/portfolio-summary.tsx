"use client"

import { useId } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PriceDisplay } from "@/components/shared/price-display"
import { cn } from "@/lib/utils"
import { TrendingDown, TrendingUp } from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts"

export interface PortfolioSummaryProps {
  totalValueJpy: number
  totalValueThb: number
  totalCostJpy: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
  cardCount: number
}

const PLACEHOLDER_TREND = [
  { label: "Mon", value: 0.92 },
  { label: "Tue", value: 0.95 },
  { label: "Wed", value: 0.93 },
  { label: "Thu", value: 0.97 },
  { label: "Fri", value: 1.0 },
  { label: "Sat", value: 0.99 },
  { label: "Sun", value: 1.0 },
]

export function PortfolioSummary({
  totalValueJpy,
  totalValueThb,
  totalCostJpy,
  unrealizedPnl,
  unrealizedPnlPercent,
  cardCount,
}: PortfolioSummaryProps) {
  const chartFillId = `portfolioValueFill-${useId().replace(/:/g, "")}`
  const pnlPositive = unrealizedPnl >= 0
  const chartData = PLACEHOLDER_TREND.map((row, i) => ({
    ...row,
    value: Math.round(totalValueJpy * row.value * (0.85 + i * 0.02)),
  }))

  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <CardDescription>Portfolio value</CardDescription>
        <CardTitle className="font-mono text-3xl font-semibold tracking-tight sm:text-4xl">
          <PriceDisplay
            priceJpy={totalValueJpy}
            priceThb={totalValueThb}
            showChange={false}
            size="lg"
          />
        </CardTitle>
        <div className="text-muted-foreground text-sm">
          Cost basis{" "}
          <span className="font-mono text-foreground">
            ¥{totalCostJpy.toLocaleString()}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 pt-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Unrealized P&amp;L
            </p>
            <div
              className={cn(
                "mt-1 flex items-center gap-2 font-mono text-2xl font-semibold",
                pnlPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
              )}
            >
              {pnlPositive ? (
                <TrendingUp className="size-6 shrink-0" aria-hidden />
              ) : (
                <TrendingDown className="size-6 shrink-0" aria-hidden />
              )}
              <span>
                {pnlPositive ? "+" : ""}
                {unrealizedPnl.toLocaleString()} ¥
              </span>
              <span className="text-base font-medium opacity-90">
                ({pnlPositive ? "+" : ""}
                {unrealizedPnlPercent.toFixed(1)}%)
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Cards tracked
            </p>
            <p className="font-mono text-2xl font-semibold">{cardCount}</p>
          </div>
        </div>

        <div>
          <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
            Value over time (sample)
          </p>
          <div className="text-muted-foreground h-40 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={chartFillId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--popover)",
                    fontSize: 12,
                  }}
                  formatter={(value) => {
                    const n = typeof value === "number" ? value : Number(value)
                    if (value == null || Number.isNaN(n)) return ["—", "Value"]
                    return [`¥${n.toLocaleString()}`, "Value"]
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fill={`url(#${chartFillId})`}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

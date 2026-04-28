"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { useUIStore } from "@/stores/ui-store"
import { t } from "@/lib/i18n"
import { formatJpyAmount, formatPct } from "@/lib/utils/currency"

export type { AllocationSlice } from "@/lib/types/portfolio"
import type { AllocationSlice } from "@/lib/types/portfolio"

const COLORS = [
  "var(--primary)",
  "var(--chart-2, #34d399)",
  "var(--chart-3, #FA999B)",
  "var(--chart-4, #E0B865)",
  "var(--chart-5, #f87171)",
  "var(--chart-6, #A57E61)",
  "var(--chart-7, #fb923c)",
  "var(--chart-8, #C49A70)",
]

export function PortfolioAllocationChart({
  data,
  totalValue,
}: {
  data: AllocationSlice[]
  totalValue?: number
}) {
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)

  const isEmpty = data.length === 0
  const isSingle = data.length === 1
  const chartData = isEmpty
    ? [{ name: "—", value: 1, percent: 100 }]
    : data

  const displayTotal = totalValue ?? data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="flex h-44 items-center gap-4 sm:h-52 sm:gap-5">
      <div className="relative size-36 shrink-0 sm:size-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="58%"
              outerRadius="88%"
              strokeWidth={isSingle || isEmpty ? 0 : 2}
              stroke={isSingle || isEmpty ? "none" : "var(--background)"}
              isAnimationActive={false}
            >
              {chartData.map((_, i) => (
                <Cell
                  key={i}
                  fill={isEmpty ? "var(--muted)" : COLORS[i % COLORS.length]}
                />
              ))}
            </Pie>
            {!isEmpty && (
              <Tooltip
                contentStyle={{
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: "var(--popover)",
                  fontSize: 13,
                  boxShadow: "0 4px 12px rgba(0,0,0,.12)",
                }}
                formatter={(value) => {
                  const n = typeof value === "number" ? value : Number(value)
                  return [formatJpyAmount(n, currency), t(lang, "value")]
                }}
              />
            )}
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {isEmpty ? (
            <p className="text-meta">{t(lang, "noData")}</p>
          ) : (
            <>
              <p className="font-price text-sm font-bold tabular-nums sm:text-base">
                {formatJpyAmount(displayTotal, currency)}
              </p>
              <p className="text-overlay text-muted-foreground">
                {data.length} {t(lang, "card")}
              </p>
            </>
          )}
        </div>
      </div>

      <div className="min-w-0 flex-1 pt-2">
        {isEmpty ? (
          <div className="flex h-full flex-col justify-center">
            <p className="text-meta">{t(lang, "noPortfolioDataDesc")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.map((d, i) => (
              <div key={`${d.name}-${i}`} className="flex items-center gap-2 text-xs">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: COLORS[i % COLORS.length] }}
                />
                <span className="min-w-0 flex-1 truncate text-muted-foreground" title={d.name}>
                  {d.name}
                </span>
                <span className="shrink-0 font-price tabular-nums">
                  {formatPct(d.percent)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

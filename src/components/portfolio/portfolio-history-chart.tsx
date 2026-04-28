"use client"

import { useState, useId } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts"
import { CalendarRange } from "lucide-react"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { useUIStore } from "@/stores/ui-store"
import { t } from "@/lib/i18n"
import { formatJpyAmount } from "@/lib/utils/currency"

type DataPoint = { label: string; value: number }

const RANGES = [
  { id: "7d", label: "7d", days: 7 },
  { id: "30d", label: "30d", days: 30 },
  { id: "90d", label: "90d", days: 90 },
  { id: "all", label: "All", days: Infinity },
] as const

export function PortfolioHistoryChart({ data }: { data: DataPoint[] }) {
  const [range, setRange] = useState<string>("all")
  const fillId = `pfHistFill-${useId().replace(/:/g, "")}`
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)

  const filteredData =
    range === "all"
      ? data
      : data.slice(-(RANGES.find((r) => r.id === range)?.days ?? data.length))

  if (data.length < 2) {
    const base = data.length === 1 ? data[0].value : 1000
    const placeholderData = Array.from({ length: 12 }, (_, i) => ({
      label: "",
      value: base + Math.sin(i * 0.6) * base * 0.04 + i * base * 0.002,
    }))
    return (
      <div className="relative">
        <div className="mb-3 opacity-30">
          <SegmentedControl
            options={RANGES.map((r) => ({ value: r.id, label: r.label }))}
            value="all"
            onChange={() => {}}
            size="sm"
            variant="pill"
            leadingIcon={CalendarRange}
            ariaLabel={t(lang, "filter")}
          />
        </div>
        <div className="h-28 w-full opacity-40 sm:h-32">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={placeholderData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--muted-foreground)" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="var(--muted-foreground)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="natural"
                dataKey="value"
                stroke="var(--muted-foreground)"
                strokeWidth={1.5}
                strokeOpacity={0.2}
                fill={`url(#${fillId})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-1.5 rounded-xl bg-card/90 px-5 py-3 shadow-sm backdrop-blur-md">
            <p className="text-meta">
              {t(lang, "noPortfolioDataDesc")}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-3">
        <SegmentedControl
          options={RANGES.map((r) => ({ value: r.id, label: r.label }))}
          value={range}
          onChange={setRange}
          size="sm"
          variant="pill"
          leadingIcon={CalendarRange}
          ariaLabel={t(lang, "filter")}
        />
      </div>
      <div className="h-44 w-full text-meta sm:h-52">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
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
                if (value == null || Number.isNaN(n)) return ["—", t(lang, "value")]
                return [formatJpyAmount(n, currency), t(lang, "value")]
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--primary)"
              strokeWidth={2}
              fill={`url(#${fillId})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

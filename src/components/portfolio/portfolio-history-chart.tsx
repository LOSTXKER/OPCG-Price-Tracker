"use client"

import { useState, useId } from "react"
import { BarChart3 } from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts"
import { cn } from "@/lib/utils"

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

  const filteredData =
    range === "all"
      ? data
      : data.slice(-(RANGES.find((r) => r.id === range)?.days ?? data.length))

  if (data.length < 2) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
        <BarChart3 className="size-8 opacity-30" />
        <p className="text-sm">ยังไม่มีข้อมูลเพียงพอ</p>
        <p className="text-[11px] opacity-60">ข้อมูลจะเริ่มบันทึกหลังจากเพิ่มการ์ด</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-1">
        {RANGES.map((r) => (
          <button
            key={r.id}
            onClick={() => setRange(r.id)}
            className={cn(
              "rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
              range === r.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {r.label}
          </button>
        ))}
      </div>
      <div className="h-40 w-full text-xs text-muted-foreground">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--popover)",
                fontSize: 13,
              }}
              formatter={(value) => {
                const n = typeof value === "number" ? value : Number(value)
                if (value == null || Number.isNaN(n)) return ["—", "มูลค่า"]
                return [`¥${n.toLocaleString()}`, "มูลค่า"]
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

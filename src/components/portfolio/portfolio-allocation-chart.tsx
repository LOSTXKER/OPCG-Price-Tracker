"use client"

import { PieChartIcon } from "lucide-react"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

export type AllocationSlice = {
  name: string
  value: number
  percent: number
}

const COLORS = [
  "var(--primary)",
  "var(--chart-2, #60a5fa)",
  "var(--chart-3, #34d399)",
  "var(--chart-4, #fbbf24)",
  "var(--chart-5, #f87171)",
  "var(--chart-6, #a78bfa)",
  "var(--chart-7, #fb923c)",
  "var(--chart-8, #38bdf8)",
]

export function PortfolioAllocationChart({
  data,
}: {
  data: AllocationSlice[]
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
        <PieChartIcon className="size-8 opacity-30" />
        <p className="text-sm">ไม่มีข้อมูล</p>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <div className="size-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="90%"
              strokeWidth={2}
              stroke="var(--background)"
              isAnimationActive={false}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--popover)",
                fontSize: 13,
              }}
              formatter={(value) => {
                const n = typeof value === "number" ? value : Number(value)
                return [`¥${n.toLocaleString()}`, "มูลค่า"]
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-2 text-xs">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: COLORS[i % COLORS.length] }}
            />
            <span className="truncate text-muted-foreground">{d.name}</span>
            <span className="ml-auto shrink-0 font-price tabular-nums">{d.percent.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

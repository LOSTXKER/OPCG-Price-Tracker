"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { Surface } from "@/components/ui/surface";
import { getTypeInfo } from "./honey-type-labels";

interface DailyData {
  date: string;
  earned: number;
  redeemed: number;
}

interface TypeCount {
  type: string;
  count: number;
}

interface HoneyChartsProps {
  dailyData: DailyData[];
  typeCounts: TypeCount[];
}

const PERIOD_OPTIONS = [
  { label: "7 วัน", days: 7 },
  { label: "14 วัน", days: 14 },
  { label: "30 วัน", days: 30 },
] as const;

const tooltipStyle = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
  boxShadow: "0 4px 12px rgba(0,0,0,.15)",
};

export function HoneyCharts({ dailyData, typeCounts }: HoneyChartsProps) {
  const [period, setPeriod] = useState(30);
  const filtered = dailyData.slice(-period);

  const sortedTypes = [...typeCounts].sort((a, b) => b.count - a.count).slice(0, 10);

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <Surface variant="outline" padding="lg" className="lg:col-span-3">
        <div className="flex items-center justify-between">
          <h3 className="text-h4">เทรนด์ Honey รายวัน</h3>
          <div className="flex gap-1 rounded-lg bg-muted/50 p-0.5">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.days}
                type="button"
                onClick={() => setPeriod(opt.days)}
                className={cn(
                  "min-h-11 rounded-md px-2.5 py-1 text-xs font-medium motion-base lg:min-h-0",
                  period === opt.days
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 h-56">
          <ResponsiveContainer
            width="100%"
            height="100%"
            initialDimension={{ width: 320, height: 224 }}
          >
            <AreaChart data={filtered} margin={{ top: 8, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis
                dataKey="date"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v: string) => {
                  const d = new Date(v);
                  return `${d.getDate()}/${d.getMonth() + 1}`;
                }}
                interval={period <= 7 ? 0 : period <= 14 ? 1 : 4}
              />
              <YAxis
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)
                }
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={(label) =>
                  new Date(String(label)).toLocaleDateString("th-TH", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                }
                formatter={(value, name) => [
                  Number(value).toLocaleString(),
                  name === "earned" ? "ได้รับ" : "แลกไป",
                ]}
              />
              <Legend
                formatter={(value: string) => (value === "earned" ? "ได้รับ" : "แลกไป")}
                iconType="circle"
                wrapperStyle={{ fontSize: "12px" }}
              />
              <Area
                type="monotone"
                dataKey="earned"
                stroke="hsl(142, 71%, 45%)"
                fill="hsl(142, 71%, 45%)"
                fillOpacity={0.1}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="redeemed"
                stroke="hsl(0, 72%, 51%)"
                fill="hsl(0, 72%, 51%)"
                fillOpacity={0.1}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Surface>

      <Surface variant="outline" padding="lg" className="lg:col-span-2">
        <h3 className="text-h4">ธุรกรรมตามประเภท</h3>
        <div className="mt-4 h-56">
          <ResponsiveContainer
            width="100%"
            height="100%"
            initialDimension={{ width: 320, height: 224 }}
          >
            <BarChart
              data={sortedTypes.map((t) => ({
                ...t,
                label: getTypeInfo(t.type).label,
              }))}
              layout="vertical"
              margin={{ top: 0, right: 4, bottom: 0, left: 0 }}
              barCategoryGap="18%"
            >
              <XAxis
                type="number"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)
                }
              />
              <YAxis
                type="category"
                dataKey="label"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                width={110}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
                contentStyle={tooltipStyle}
                formatter={(value) => [
                  `${Number(value).toLocaleString()} ครั้ง`,
                  "จำนวน",
                ]}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={24}>
                {sortedTypes.map((entry) => (
                  <Cell
                    key={entry.type}
                    fill={getTypeInfo(entry.type).chartColor}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Surface>
    </div>
  );
}

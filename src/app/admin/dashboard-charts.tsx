"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface ChartData {
  quality: {
    name: string;
    value: number;
    missing: number;
    total: number;
  }[];
  rarities: {
    rarity: string;
    count: number;
    color: string;
  }[];
}

const RARITY_CHART_COLORS: Record<string, string> = {
  C: "hsl(0, 0%, 55%)",
  UC: "hsl(142, 60%, 45%)",
  R: "hsl(217, 80%, 58%)",
  SR: "hsl(262, 75%, 58%)",
  SEC: "hsl(38, 92%, 50%)",
  SP: "hsl(330, 75%, 55%)",
  L: "hsl(24, 90%, 53%)",
  TR: "hsl(0, 72%, 51%)",
  DON: "hsl(0, 65%, 55%)",
  P: "hsl(187, 80%, 43%)",
};

const FALLBACK_COLOR = "hsl(0, 0%, 40%)";

export function DashboardCharts({ data }: { data: ChartData }) {
  const overallComplete = data.quality.reduce((sum, q) => sum + q.value, 0);
  const overallTotal = data.quality.reduce((sum, q) => sum + q.total, 0);
  const overallPct =
    overallTotal > 0
      ? ((overallComplete / overallTotal) * 100).toFixed(1)
      : "0";

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      {/* Completeness Donut — compact */}
      <div className="rounded-xl border border-border/50 bg-card p-5 lg:col-span-2">
        <h3 className="text-sm font-semibold text-foreground">ความครบถ้วนข้อมูล</h3>
        <div className="mt-4 flex items-center gap-5">
          <div className="relative size-28 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "ครบ", value: overallComplete },
                    { name: "ขาด", value: Math.max(overallTotal - overallComplete, 0) },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={32}
                  outerRadius={48}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                  startAngle={90}
                  endAngle={-270}
                >
                  <Cell fill="hsl(142, 71%, 45%)" />
                  <Cell fill="hsl(var(--muted))" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold tracking-tight">{overallPct}%</span>
            </div>
          </div>
          <div className="flex-1 space-y-2.5">
            {data.quality.map((q) => {
              const pctVal = q.total > 0 ? (q.value / q.total) * 100 : 0;
              return (
                <div key={q.name}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">{q.name}</span>
                    <span className="tabular-nums text-xs font-semibold">{pctVal.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted/60">
                    <div
                      className="h-full rounded-full bg-green-500/80 transition-all"
                      style={{ width: `${Math.min(pctVal, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Rarity Bar Chart */}
      <div className="rounded-xl border border-border/50 bg-card p-5 lg:col-span-3">
        <h3 className="text-sm font-semibold text-foreground">การ์ดตามระดับความหายาก</h3>
        <div className="mt-3 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.rarities}
              margin={{ top: 8, right: 4, bottom: 0, left: -20 }}
              barCategoryGap="20%"
            >
              <XAxis
                dataKey="rarity"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v))}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,.15)",
                }}
                formatter={(value) => [
                  `${Number(value).toLocaleString()} ใบ`,
                  "จำนวน",
                ]}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={36}>
                {data.rarities.map((entry) => (
                  <Cell
                    key={entry.rarity}
                    fill={RARITY_CHART_COLORS[entry.rarity] ?? FALLBACK_COLOR}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

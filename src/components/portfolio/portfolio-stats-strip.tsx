"use client"

import { TrendingDown, TrendingUp, Wallet, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"

export interface PortfolioStats {
  totalValueJpy: number
  totalCostJpy: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
  bestPerformer: { name: string; pnl: number; pnlPercent: number } | null
  worstPerformer: { name: string; pnl: number; pnlPercent: number } | null
}

function StatCard({
  label,
  children,
  icon: Icon,
  accent,
}: {
  label: string
  children: React.ReactNode
  icon: React.ComponentType<{ className?: string }>
  accent?: "green" | "red" | "neutral"
}) {
  const accentStyles = {
    green: "border-l-emerald-500 bg-emerald-500/[0.03]",
    red: "border-l-red-500 bg-red-500/[0.03]",
    neutral: "border-l-border",
  }

  return (
    <div className={cn(
      "rounded-xl border border-border bg-card p-4 border-l-[3px] transition-colors",
      accent ? accentStyles[accent] : accentStyles.neutral,
    )}>
      <div className="mb-2.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      {children}
    </div>
  )
}

export function PortfolioStatsStrip({
  stats,
  hideBalance,
}: {
  stats: PortfolioStats
  hideBalance?: boolean
}) {
  const pnlPositive = stats.unrealizedPnl >= 0

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="กำไร/ขาดทุน"
        icon={pnlPositive ? TrendingUp : TrendingDown}
        accent={stats.totalCostJpy > 0 ? (pnlPositive ? "green" : "red") : "neutral"}
      >
        <p className={cn(
          "font-price text-xl font-bold tabular-nums",
          pnlPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
        )}>
          {hideBalance ? "••••" : `${pnlPositive ? "+" : ""}¥${stats.unrealizedPnl.toLocaleString()}`}
        </p>
        {stats.totalCostJpy > 0 && (
          <p className={cn(
            "mt-0.5 font-price text-xs font-medium tabular-nums",
            pnlPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
          )}>
            {pnlPositive ? "▲" : "▼"} {Math.abs(stats.unrealizedPnlPercent).toFixed(2)}%
          </p>
        )}
      </StatCard>

      <StatCard label="ต้นทุนรวม" icon={DollarSign}>
        <p className="font-price text-xl font-bold tabular-nums">
          {hideBalance ? "••••" : `¥${stats.totalCostJpy.toLocaleString()}`}
        </p>
      </StatCard>

      <StatCard label="ผลงานดีที่สุด" icon={TrendingUp} accent={stats.bestPerformer ? "green" : "neutral"}>
        {stats.bestPerformer ? (
          <>
            <p className="truncate text-sm font-semibold">{stats.bestPerformer.name}</p>
            <p className="mt-0.5 font-price text-xs font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
              {hideBalance ? "••••" : `+¥${stats.bestPerformer.pnl.toLocaleString()}`}
              {" "}
              <span className="text-emerald-600/70 dark:text-emerald-400/70">
                ▲ {Math.abs(stats.bestPerformer.pnlPercent).toFixed(1)}%
              </span>
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">—</p>
        )}
      </StatCard>

      <StatCard label="ผลงานแย่ที่สุด" icon={TrendingDown} accent={stats.worstPerformer ? "red" : "neutral"}>
        {stats.worstPerformer ? (
          <>
            <p className="truncate text-sm font-semibold">{stats.worstPerformer.name}</p>
            <p className="mt-0.5 font-price text-xs font-medium tabular-nums text-red-600 dark:text-red-400">
              {hideBalance ? "••••" : `¥${stats.worstPerformer.pnl.toLocaleString()}`}
              {" "}
              <span className="text-red-600/70 dark:text-red-400/70">
                ▼ {Math.abs(stats.worstPerformer.pnlPercent).toFixed(1)}%
              </span>
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">—</p>
        )}
      </StatCard>
    </div>
  )
}

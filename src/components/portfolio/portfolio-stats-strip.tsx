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
  className,
}: {
  label: string
  children: React.ReactNode
  icon: React.ComponentType<{ className?: string }>
  className?: string
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-4", className)}>
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      {children}
    </div>
  )
}

export function PortfolioStatsStrip({ stats }: { stats: PortfolioStats }) {
  const pnlPositive = stats.unrealizedPnl >= 0

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="กำไร/ขาดทุน" icon={pnlPositive ? TrendingUp : TrendingDown}>
        <p className={cn(
          "font-price text-xl font-bold tabular-nums",
          pnlPositive ? "text-price-up" : "text-price-down"
        )}>
          {pnlPositive ? "+" : ""}¥{stats.unrealizedPnl.toLocaleString()}
        </p>
        <p className={cn(
          "mt-0.5 font-price text-xs tabular-nums",
          pnlPositive ? "text-price-up" : "text-price-down"
        )}>
          {pnlPositive ? "+" : ""}{stats.unrealizedPnlPercent.toFixed(1)}%
        </p>
      </StatCard>

      <StatCard label="ต้นทุน" icon={DollarSign}>
        <p className="font-price text-xl font-bold tabular-nums">
          ¥{stats.totalCostJpy.toLocaleString()}
        </p>
      </StatCard>

      <StatCard label="ผลงานดีสุด" icon={TrendingUp}>
        {stats.bestPerformer ? (
          <>
            <p className="truncate text-sm font-medium">{stats.bestPerformer.name}</p>
            <p className="mt-0.5 font-price text-xs tabular-nums text-price-up">
              +¥{stats.bestPerformer.pnl.toLocaleString()} (+{stats.bestPerformer.pnlPercent.toFixed(1)}%)
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">—</p>
        )}
      </StatCard>

      <StatCard label="ผลงานแย่สุด" icon={TrendingDown}>
        {stats.worstPerformer ? (
          <>
            <p className="truncate text-sm font-medium">{stats.worstPerformer.name}</p>
            <p className="mt-0.5 font-price text-xs tabular-nums text-price-down">
              ¥{stats.worstPerformer.pnl.toLocaleString()} ({stats.worstPerformer.pnlPercent.toFixed(1)}%)
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">—</p>
        )}
      </StatCard>
    </div>
  )
}

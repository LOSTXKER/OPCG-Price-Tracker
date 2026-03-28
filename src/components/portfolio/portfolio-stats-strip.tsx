"use client"

import { TrendingDown, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

export interface PortfolioStats {
  totalValueJpy: number
  totalCostJpy: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
  bestPerformer: { name: string; pnl: number; pnlPercent: number } | null
  worstPerformer: { name: string; pnl: number; pnlPercent: number } | null
}

export function PortfolioStatsStrip({
  stats,
  hideBalance,
}: {
  stats: PortfolioStats
  hideBalance?: boolean
}) {
  const pnlPositive = stats.unrealizedPnl >= 0
  const hasCost = stats.totalCostJpy > 0

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {/* PnL card */}
      <div className={cn(
        "panel flex items-center gap-4 p-4",
      )}>
        <div className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          hasCost
            ? pnlPositive
              ? "bg-price-up/10 text-price-up"
              : "bg-price-down/10 text-price-down"
            : "bg-muted text-muted-foreground"
        )}>
          {pnlPositive ? <TrendingUp className="size-5" /> : <TrendingDown className="size-5" />}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-muted-foreground">กำไร / ขาดทุน</p>
          <p className={cn(
            "font-price text-lg font-bold tabular-nums",
            hasCost
              ? pnlPositive
                ? "text-price-up"
                : "text-price-down"
              : "text-foreground"
          )}>
            {hideBalance ? "••••" : `${pnlPositive ? "+" : ""}¥${stats.unrealizedPnl.toLocaleString()}`}
          </p>
          {hasCost && (
            <p className={cn(
              "font-price text-xs tabular-nums",
              pnlPositive
                ? "text-price-up/70"
                : "text-price-down/70"
            )}>
              {pnlPositive ? "+" : ""}{stats.unrealizedPnlPercent.toFixed(2)}%
            </p>
          )}
        </div>
      </div>

      {/* Best / Worst combined card */}
      <div className="panel p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-price-up/10 text-price-up">
              <TrendingUp className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-muted-foreground">ผลงานดีที่สุด</p>
              {stats.bestPerformer ? (
                <div className="flex items-baseline gap-2">
                  <p className="truncate text-sm font-semibold">{stats.bestPerformer.name}</p>
                  <span className="shrink-0 font-price text-xs font-medium tabular-nums text-price-up">
                    {hideBalance ? "••••" : `+¥${stats.bestPerformer.pnl.toLocaleString()}`}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </div>
          </div>
          <div className="h-px bg-border/40" />
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-price-down/10 text-price-down">
              <TrendingDown className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-muted-foreground">ผลงานแย่ที่สุด</p>
              {stats.worstPerformer ? (
                <div className="flex items-baseline gap-2">
                  <p className="truncate text-sm font-semibold">{stats.worstPerformer.name}</p>
                  <span className="shrink-0 font-price text-xs font-medium tabular-nums text-price-down">
                    {hideBalance ? "••••" : `¥${stats.worstPerformer.pnl.toLocaleString()}`}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

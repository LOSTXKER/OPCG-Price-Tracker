"use client"

import { Price } from "@/components/shared/price-inline"
import { cn } from "@/lib/utils"

interface PortfolioHeroProps {
  totalValueJpy: number
  totalCostJpy: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
  hideBalance?: boolean
}

export function PortfolioHero({
  totalValueJpy,
  totalCostJpy,
  unrealizedPnl,
  unrealizedPnlPercent,
  hideBalance,
}: PortfolioHeroProps) {
  return (
    <div className="panel p-5">
      <p className="text-xs text-muted-foreground">มูลค่าพอร์ต</p>
      <div className="mt-1 flex flex-wrap items-baseline gap-3">
        <span className="font-price text-4xl font-bold tabular-nums tracking-tight">
          {hideBalance ? "••••••" : <Price jpy={totalValueJpy} />}
        </span>
        {totalCostJpy > 0 && (
          <span className={cn(
            "rounded-full px-2.5 py-0.5 text-sm font-semibold tabular-nums",
            unrealizedPnl >= 0
              ? "bg-price-up/10 text-price-up"
              : "bg-price-down/10 text-price-down"
          )}>
            {unrealizedPnl >= 0 ? "+" : ""}{unrealizedPnlPercent.toFixed(2)}%
          </span>
        )}
      </div>
      {totalCostJpy > 0 && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          ต้นทุน{" "}
          <span className="font-price font-medium tabular-nums text-foreground">
            {hideBalance ? "••••" : `¥${totalCostJpy.toLocaleString()}`}
          </span>
        </p>
      )}
    </div>
  )
}

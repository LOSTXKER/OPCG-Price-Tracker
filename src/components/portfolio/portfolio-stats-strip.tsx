"use client"

import { TrendingDown, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/stores/ui-store"
import { t } from "@/lib/i18n"
import { formatJpyAmount } from "@/lib/utils/currency"

export type { PortfolioStats } from "@/lib/types/portfolio"
import type { PortfolioStats } from "@/lib/types/portfolio"

export function PortfolioStatsStrip({
  stats,
  hideBalance,
  cardCount = 0,
}: {
  stats: PortfolioStats
  hideBalance?: boolean
  cardCount?: number
}) {
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)
  const showBestWorst = cardCount > 1

  if (!showBestWorst) return null

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {/* Best performer */}
      <div className="panel flex items-center gap-3 rounded-xl px-4 py-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-price-up/10 text-price-up">
          <TrendingUp className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-muted-foreground">{t(lang, "bestPerformer")}</p>
          {stats.bestPerformer ? (
            <div className="flex items-baseline gap-2">
              <p className="min-w-0 truncate text-sm font-semibold">{stats.bestPerformer.name}</p>
              <span className="shrink-0 font-price text-xs font-semibold tabular-nums text-price-up">
                {hideBalance ? "••••" : `+${formatJpyAmount(stats.bestPerformer.pnl, currency)}`}
              </span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}
        </div>
      </div>

      {/* Worst performer */}
      <div className="panel flex items-center gap-3 rounded-xl px-4 py-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-price-down/10 text-price-down">
          <TrendingDown className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-muted-foreground">{t(lang, "worstPerformer")}</p>
          {stats.worstPerformer ? (
            <div className="flex items-baseline gap-2">
              <p className="min-w-0 truncate text-sm font-semibold">{stats.worstPerformer.name}</p>
              <span className="shrink-0 font-price text-xs font-semibold tabular-nums text-price-down">
                {hideBalance ? "••••" : formatJpyAmount(stats.worstPerformer.pnl, currency)}
              </span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}
        </div>
      </div>
    </div>
  )
}

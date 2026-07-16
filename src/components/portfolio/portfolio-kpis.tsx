"use client"

import { ArrowDown, ArrowUp } from "lucide-react"

import { MASKED } from "@/lib/constants/ui"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { formatDisplayValue, formatPct, jpyToDisplayValue } from "@/lib/utils/currency"
import { useUIStore } from "@/stores/ui-store"
import type { PortfolioStats } from "@/lib/types/portfolio"

/**
 * Portfolio KPI quartet — กำไร/ขาดทุน · ต้นทุน · ผลงานดีที่สุด · ผลงานแย่ที่สุด
 * (VISION §5.3). One responsive layout, no variant prop: a 2×2 grid framed by
 * hairlines on mobile/tablet that collapses into a divided vertical rail at
 * `lg:` for the desktop right-hand column — same four stats, just a
 * breakpoint-driven composition swap (grid → stacked rows).
 *
 * Extracted from `PortfolioHeroPanel` (kept for `portfolio-financial-guard.test.tsx`,
 * not deleted) so the single-page portfolio can place the hero, chart, and KPI
 * row independently instead of inside one boxed panel.
 */
export function PortfolioKpis({
  stats,
  hideBalance = false,
}: {
  stats: PortfolioStats
  hideBalance?: boolean
}) {
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)

  const hasPerformance = stats.performanceComplete && stats.unrealizedPnl != null
  const isUp = (stats.unrealizedPnl ?? 0) >= 0
  const money = (jpy: number) =>
    hideBalance ? MASKED : formatDisplayValue(jpyToDisplayValue(jpy, currency), currency)

  if (!hasPerformance) {
    return (
      <p className="border-y border-hair py-4 text-meta">
        {t(lang, "portfolioPerformanceIncomplete")}
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-y border-hair py-4 sm:grid-cols-4 lg:grid-cols-1 lg:gap-x-0 lg:gap-y-0 lg:divide-y lg:divide-hair lg:border-y-0 lg:py-0">
      <div className="lg:py-3">
        <p className="text-eyebrow">{t(lang, "pnl")}</p>
        <p className="mt-1">
          {stats.unrealizedPnl != null ? (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-price",
                hideBalance
                  ? "text-foreground"
                  : isUp
                    ? "text-price-up"
                    : "text-price-down",
              )}
            >
              {!hideBalance &&
                (isUp ? (
                  <ArrowUp className="size-3" />
                ) : (
                  <ArrowDown className="size-3" />
                ))}
              {hideBalance
                ? MASKED
                : `${isUp ? "+" : "−"}${money(Math.abs(stats.unrealizedPnl))}`}
            </span>
          ) : (
            <span className="text-price text-muted-foreground">—</span>
          )}
        </p>
      </div>

      <div className="lg:py-3">
        <p className="text-eyebrow">{t(lang, "costBasis")}</p>
        <p className="mt-1 text-price text-foreground/80">
          {money(stats.totalCostJpy)}
        </p>
      </div>

      <PerformerStat
        label={t(lang, "bestPerformer")}
        performer={stats.bestPerformer}
        hideBalance={hideBalance}
        formatMoney={money}
      />
      <PerformerStat
        label={t(lang, "worstPerformer")}
        performer={stats.worstPerformer}
        hideBalance={hideBalance}
        formatMoney={money}
      />
    </div>
  )
}

function PerformerStat({
  label,
  performer,
  hideBalance,
  formatMoney,
}: {
  label: string
  performer: { name: string; pnl: number; pnlPercent: number | null } | null
  hideBalance: boolean
  formatMoney: (jpy: number) => string
}) {
  const up = (performer?.pnl ?? 0) >= 0
  return (
    <div className="min-w-0 lg:py-3">
      <p className="text-eyebrow">{label}</p>
      {performer ? (
        <p className="mt-1 flex items-baseline gap-1.5">
          <span className="truncate text-sm font-medium">{performer.name}</span>
          {hideBalance ? (
            <span className="shrink-0 text-micro tabular-nums text-foreground">{MASKED}</span>
          ) : (
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-0.5 font-price text-micro tabular-nums",
                up ? "text-price-up" : "text-price-down",
              )}
            >
              {up ? <ArrowUp className="size-2.5" /> : <ArrowDown className="size-2.5" />}
              {performer.pnlPercent != null
                ? `${formatPct(Math.abs(performer.pnlPercent), 1)}%`
                : formatMoney(Math.abs(performer.pnl))}
            </span>
          )}
        </p>
      ) : (
        <p className="mt-1 text-price text-muted-foreground">—</p>
      )}
    </div>
  )
}

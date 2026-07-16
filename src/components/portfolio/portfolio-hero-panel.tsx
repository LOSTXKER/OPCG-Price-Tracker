"use client"

import { ArrowDown, ArrowUp } from "lucide-react"

import { Surface } from "@/components/ui/surface"
import { MASKED } from "@/lib/constants/ui"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import {
  formatDisplayValue,
  jpyToDisplayValue,
  formatPct,
} from "@/lib/utils/currency"
import { useUIStore } from "@/stores/ui-store"
import type { PortfolioStats } from "@/lib/types/portfolio"

import { PortfolioHero } from "./portfolio-hero"

/**
 * The overview hero card: ONE panel carrying the portfolio value + delta and a
 * four-stat row (P/L · Cost · Best · Worst) — the live site's layout, rebuilt on
 * the warm token system.
 */
export function PortfolioHeroPanel({
  stats,
  hideBalance = false,
  scopeLabel = null,
}: {
  stats: PortfolioStats
  hideBalance?: boolean
  scopeLabel?: string | null
}) {
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)

  const hasPerformance = stats.performanceComplete && stats.unrealizedPnl != null
  const isUp = (stats.unrealizedPnl ?? 0) >= 0
  const money = (jpy: number) =>
    hideBalance ? MASKED : formatDisplayValue(jpyToDisplayValue(jpy, currency), currency)

  return (
    <Surface variant="panel" className="relative overflow-hidden p-4 sm:p-5">
      <PortfolioHero
        valueJpy={stats.totalValueJpy}
        deltaJpy={stats.unrealizedPnl}
        deltaPct={stats.unrealizedPnlPercent}
        hasPnl={hasPerformance}
        valueAvailable={stats.valuedCopyCount > 0}
        valuationComplete={stats.valuationComplete}
        hideBalance={hideBalance}
        scopeLabel={scopeLabel}
      />

      {hasPerformance ? (
        /* Stat row — P/L · Cost Basis · Best · Worst (no market-value repeat) */
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-hair pt-4 sm:grid-cols-4">
          <div>
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

          <div>
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
      ) : (
        <p className="mt-4 border-t border-hair pt-4 text-meta">
          {t(lang, "portfolioPerformanceIncomplete")}
        </p>
      )}
    </Surface>
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
    <div className="min-w-0">
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

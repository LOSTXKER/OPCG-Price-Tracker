"use client"

import { Surface } from "@/components/ui/surface"
import { MASKED } from "@/lib/constants/ui"
import { t } from "@/lib/i18n"
import type { PortfolioStats } from "@/lib/types/portfolio"
import { cn } from "@/lib/utils"
import {
  formatDisplayValue,
  formatPct,
  jpyToDisplayValue,
} from "@/lib/utils/currency"
import { useUIStore } from "@/stores/ui-store"

import { PortfolioHero } from "./portfolio-hero"

/** Value + ROI → P/L + cost: one financial card without performer stats. */
export function PortfolioSummary({
  stats,
  hideBalance = false,
  scopeLabel = null,
}: {
  stats: PortfolioStats
  hideBalance?: boolean
  scopeLabel?: string | null
}) {
  const lang = useUIStore((state) => state.language)
  const currency = useUIStore((state) => state.currency)
  const hasPerformance =
    stats.performanceComplete && stats.unrealizedPnl != null
  const isUp = (stats.unrealizedPnl ?? 0) >= 0
  const trend =
    !hasPerformance || stats.unrealizedPnl === 0
      ? "neutral"
      : isUp
        ? "up"
        : "down"
  const costAvailable = stats.costedCopyCount > 0
  const costComplete = stats.costedCopyCount === stats.totalCopyCount
  const money = (jpy: number) =>
    formatDisplayValue(jpyToDisplayValue(jpy, currency), currency)

  const pnlValue = !hasPerformance
    ? "—"
    : hideBalance
      ? MASKED
      : `${isUp ? "+" : "−"}${money(Math.abs(stats.unrealizedPnl ?? 0))}`
  const pnlPercent =
    hasPerformance && stats.unrealizedPnlPercent != null
      ? `${isUp ? "+" : "−"}${formatPct(
          Math.abs(stats.unrealizedPnlPercent),
          1,
        )}%`
      : null
  const costValue = !costAvailable
    ? "—"
    : hideBalance
      ? MASKED
      : `${costComplete ? "" : "≈ "}${money(stats.recordedCostJpy)}`

  return (
    <Surface
      as="section"
      variant="hero"
      padding="none"
      className="portfolio-financial-gradient overflow-hidden p-4 sm:p-6"
      data-slot="portfolio-summary"
      data-trend={trend}
    >
      <div
        className="flex flex-wrap items-end gap-x-3 gap-y-2"
        data-slot="portfolio-summary-value"
      >
        <div className="min-w-0">
          {/* Amount and ROI share the hero line; P/L money appears once below. */}
          <PortfolioHero
            valueJpy={stats.totalValueJpy}
            deltaJpy={stats.unrealizedPnl}
            deltaPct={stats.unrealizedPnlPercent}
            hasPnl={false}
            valueAvailable={stats.valuedCopyCount > 0}
            valuationComplete={stats.valuationComplete}
            hideBalance={hideBalance}
            scopeLabel={scopeLabel}
          />
        </div>

        {pnlPercent ? (
          <span
            className={cn(
              "mb-1 inline-flex shrink-0 rounded-full px-2.5 py-1 text-label font-price tabular-nums",
              isUp
                ? "bg-price-up/10 text-price-up-on-soft"
                : "bg-price-down/10 text-price-down-on-soft",
            )}
            data-slot="portfolio-summary-roi"
          >
            <span className="sr-only">{t(lang, "roi")} </span>
            {pnlPercent}
          </span>
        ) : null}
      </div>

      <dl
        className="mt-4 grid max-w-2xl grid-cols-2 gap-0 sm:mt-6"
        data-slot="portfolio-summary-metrics"
      >
        <div className="min-w-0 pr-3 sm:pr-6" data-slot="portfolio-summary-pnl">
          <dt className="text-label text-foreground">
            {t(lang, "unrealizedPnl")}
          </dt>
          <dd
            className={cn(
              "mt-1.5 min-w-0 text-h4 font-price tabular-nums",
              !hasPerformance
                ? "text-muted-foreground"
                : isUp
                  ? "text-price-up"
                  : "text-price-down",
            )}
          >
            {pnlValue}
          </dd>
        </div>

        <div
          className="min-w-0 border-l border-hair pl-3 sm:pl-6"
          data-slot="portfolio-summary-cost"
        >
          <dt className="text-label text-foreground">{t(lang, "costBasis")}</dt>
          <dd
            className={cn(
              "mt-1.5 text-h4 font-price tabular-nums",
              costAvailable ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {costValue}
          </dd>
          {!costComplete && stats.totalCopyCount > 0 ? (
            <p className="mt-1 text-meta">
              {`${t(lang, "dataCoverage")} ${stats.costedCopyCount.toLocaleString()} / ${stats.totalCopyCount.toLocaleString()}`}
            </p>
          ) : null}
        </div>
      </dl>

      {!hasPerformance ? (
        <p className="mt-4 max-w-2xl text-meta">
          {t(lang, "portfolioPerformanceIncomplete")}
        </p>
      ) : null}
    </Surface>
  )
}

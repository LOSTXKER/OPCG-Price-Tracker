"use client"

import dynamic from "next/dynamic"
import {
  Calculator,
  Gauge,
  Layers3,
  type LucideIcon,
} from "lucide-react"

import { Surface } from "@/components/ui/surface"
import { MASKED } from "@/lib/constants/ui"
import { ALL_GAMES } from "@/lib/game/constants"
import { getCardName, getLocale, t } from "@/lib/i18n"
import {
  getPortfolioConcentration,
  getPortfolioTrackedSpan,
} from "@/lib/portfolio/insights"
import {
  formatDisplayValue,
  formatPct,
  jpyToDisplayValue,
} from "@/lib/utils/currency"
import { useUIStore } from "@/stores/ui-store"
import type {
  AllocationSlice,
  AssetRow,
  GameBreakdown,
  HistoryPoint,
  PortfolioStats,
} from "@/lib/types/portfolio"

import { PortfolioAllocationPanel } from "./portfolio-allocation-panel"
import { PortfolioGameBreakdown } from "./portfolio-game-breakdown"

const PortfolioScrubChart = dynamic(
  () =>
    import("./portfolio-scrub-chart").then(
      (module) => module.PortfolioScrubChart,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-24 animate-pulse rounded-lg bg-muted/20 sm:h-28" />
    ),
  },
)

export type PortfolioComposition = "game" | "card" | null

export function getPortfolioComposition({
  gameFilter,
  gameCount,
  valuationComplete,
  allocationCount,
}: {
  gameFilter: string
  gameCount: number
  valuationComplete: boolean
  allocationCount: number
}): PortfolioComposition {
  if (gameFilter === ALL_GAMES && gameCount > 1) return "game"
  if (valuationComplete && allocationCount > 0) return "card"
  return null
}

function InsightKpi({
  icon: Icon,
  label,
  value,
  meta,
}: {
  icon: LucideIcon
  label: string
  value: React.ReactNode
  meta?: React.ReactNode
}) {
  return (
    <Surface
      as="article"
      variant="outline"
      padding="none"
      className="min-w-0 p-3.5 sm:p-4"
      data-slot="portfolio-insights-kpi"
    >
      <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
        <Icon className="size-4 shrink-0" aria-hidden />
        <p className="truncate text-label">{label}</p>
      </div>
      <p className="mt-2 truncate text-h4 font-price tabular-nums">{value}</p>
      {meta ? <p className="mt-1 truncate text-meta">{meta}</p> : null}
    </Surface>
  )
}

export function PortfolioInsights({
  history,
  assets,
  allocation,
  gameBreakdown,
  stats,
  scopeLabel = null,
  gameFilter,
  onGameSelect,
  hideBalance = false,
}: {
  history: HistoryPoint[]
  assets: AssetRow[]
  allocation: AllocationSlice[]
  gameBreakdown: GameBreakdown[]
  stats: PortfolioStats
  scopeLabel?: string | null
  gameFilter: string
  onGameSelect: (game: string) => void
  hideBalance?: boolean
}) {
  const lang = useUIStore((state) => state.language)
  const currency = useUIStore((state) => state.currency)
  const composition = getPortfolioComposition({
    gameFilter,
    gameCount: gameBreakdown.length,
    valuationComplete: stats.valuationComplete,
    allocationCount: allocation.length,
  })
  const concentration = getPortfolioConcentration(assets)
  const trackedSpan = getPortfolioTrackedSpan(history)
  const scopedToGame = gameFilter !== ALL_GAMES
  const copyCount = assets.reduce((sum, asset) => sum + asset.quantity, 0)

  const money = (jpy: number) =>
    formatDisplayValue(jpyToDisplayValue(jpy, currency), currency)
  const coverage = (covered: number, total: number) =>
    total > 0
      ? `${covered.toLocaleString(getLocale(lang))} / ${total.toLocaleString(
          getLocale(lang),
        )} · ${formatPct((covered / total) * 100, 0)}%`
      : "—"
  const countSummary = t(lang, "portfolioCardCountSummary")
    .replace("{holdings}", assets.length.toLocaleString(getLocale(lang)))
    .replace("{copies}", copyCount.toLocaleString(getLocale(lang)))
  const compactCountSummary =
    assets.length === copyCount
      ? `${copyCount.toLocaleString(getLocale(lang))} ${t(
          lang,
          "cardCopiesShort",
        )}`
      : countSummary
  const averageKnownCost =
    stats.costedCopyCount > 0
      ? stats.recordedCostJpy / stats.costedCopyCount
      : null
  const averageCostLabel =
    averageKnownCost == null
      ? "—"
      : hideBalance
        ? MASKED
        : averageKnownCost === 0
          ? t(lang, "portfolioFreeCost")
          : money(averageKnownCost)
  const costCoverageCopy = t(lang, "costCoverage")
    .replace(
      "{known}",
      stats.costedCopyCount.toLocaleString(getLocale(lang)),
    )
    .replace(
      "{total}",
      stats.totalCopyCount.toLocaleString(getLocale(lang)),
    )
  const concentrationLabel =
    concentration.top1Percent == null
      ? "—"
      : `${formatPct(concentration.top1Percent, 1)}%`
  const trackedSince = trackedSpan.startedAt
    ? new Date(trackedSpan.startedAt).toLocaleDateString(getLocale(lang), {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : t(lang, "dayToday")

  return (
    <div className="space-y-4 sm:space-y-5" data-slot="portfolio-insights">
      <div
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 [&>*:last-child]:col-span-2 sm:[&>*:last-child]:col-span-1"
        data-slot="portfolio-insights-kpis"
      >
        <InsightKpi
          icon={Layers3}
          label={
            scopeLabel
              ? `${t(lang, "assets")} · ${scopeLabel}`
              : t(lang, "assets")
          }
          value={compactCountSummary}
        />
        <InsightKpi
          icon={Calculator}
          label={t(lang, "averageCostPerCard")}
          value={averageCostLabel}
          meta={costCoverageCopy}
        />
        <InsightKpi
          icon={Gauge}
          label={t(lang, "largestPortfolioShare")}
          value={concentrationLabel}
          meta={
            concentration.top1Percent != null && concentration.groups[0]
              ? getCardName(lang, concentration.groups[0].asset)
              : coverage(
                  concentration.coverage.coveredCopyCount,
                  concentration.coverage.totalCopyCount,
                )
          }
        />
      </div>

      {!scopedToGame && trackedSpan.pointCount >= 2 ? (
        <Surface
          as="section"
          variant="panel"
          padding="none"
          className="min-w-0 p-4 sm:p-5"
          data-slot="portfolio-insights-history"
        >
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
            <div>
              <h2 className="text-h4">{t(lang, "valueOverTime")}</h2>
              <p className="mt-0.5 text-meta">
                {t(lang, "trackingSince")} · {trackedSince}
              </p>
            </div>
            <p className="text-meta font-price tabular-nums">
              {trackedSpan.daySpan.toLocaleString(getLocale(lang))} {t(lang, "days")}
            </p>
          </div>

          <div className="mt-4 min-w-0">
            <PortfolioScrubChart
              data={history}
              stats={stats}
              hideBalance={hideBalance}
            />
          </div>
        </Surface>
      ) : null}

      <Surface
        as="section"
        variant="panel"
        padding="none"
        className="min-w-0 p-4 sm:p-5"
        data-slot="portfolio-insights-allocation"
      >
        <div>
          <h2 className="text-h4">{t(lang, "holdingsBreakdown")}</h2>
          <p className="mt-0.5 text-meta">{t(lang, "portfolioStructure")}</p>
        </div>

        <div className="mt-4">
          {composition === "game" ? (
            <PortfolioGameBreakdown
              breakdown={gameBreakdown}
              totalValueJpy={stats.totalValueJpy}
              onSelect={onGameSelect}
              hideBalance={hideBalance}
              showHeading={false}
            />
          ) : composition === "card" ? (
            <PortfolioAllocationPanel
              allocation={allocation}
              hideBalance={hideBalance}
              showHeading={false}
            />
          ) : (
            <p className="text-meta">
              {concentration.coverage.totalCopyCount > 0
                ? `${t(lang, "dataCoverage")} · ${coverage(
                    concentration.coverage.coveredCopyCount,
                    concentration.coverage.totalCopyCount,
                  )}`
                : t(lang, "noPortfolioData")}
            </p>
          )}
        </div>
      </Surface>
    </div>
  )
}

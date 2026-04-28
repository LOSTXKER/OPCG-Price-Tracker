"use client"

import dynamic from "next/dynamic"
import { AlertTriangle, ExternalLink, Info, Shield } from "lucide-react"

import type { ChartStats } from "@/components/cards/price-chart"
import { PriceDisplay } from "@/components/shared/price-display"
import { PriceUsd } from "@/components/shared/price-usd"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { t, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { formatPctSmart } from "@/lib/utils/format-pct-smart"
import { relativeTime } from "@/lib/utils/time"

const CardDetailPriceChart = dynamic(
  () => import("../card-detail-price-chart").then((m) => m.CardDetailPriceChart),
  { ssr: false, loading: () => <div className="h-[340px] animate-pulse rounded-xl bg-muted" /> },
)

const SNKRDUNK_SEARCH_BASE = "https://snkrdunk.com/search?keyword="

function yuyuteiSearchUrl(card: { baseCode: string | null; cardCode: string }) {
  const code = card.baseCode ?? card.cardCode
  return `https://yuyu-tei.jp/sell/opc/?word=${encodeURIComponent(code)}`
}

function snkrdunkSearchUrl(card: {
  nameEn?: string | null
  nameJp: string
  cardCode: string
}) {
  const term = card.nameEn ?? card.nameJp ?? card.cardCode
  return `${SNKRDUNK_SEARCH_BASE}${encodeURIComponent(term)}`
}

type ChartDataPoint = {
  scrapedAt: string
  priceJpy: number | null
  priceThb: number | null
  priceUsd: number | null
  source?: string
  gradeCondition?: string | null
}

export function CardPriceStatsPanel({
  card,
  snkrdunkPrices,
  hasPsa10,
  priceMode,
  onPriceModeChange,
  chartPeriod,
  onChartPeriodChange,
  chartStats,
  onChartStatsChange,
  availableSources,
  latestUpdatedAt,
  isStale,
  maxDays,
  lang,
}: {
  card: {
    cardCode: string
    baseCode: string | null
    nameJp: string
    nameEn?: string | null
    price: { priceJpy: number; priceThb: number | null } | null
    chartData: ChartDataPoint[]
  }
  snkrdunkPrices?: {
    psa10AskUsd: number | null
    psa10SoldUsd: number | null
    lastSoldUsd: number | null
  } | null
  hasPsa10: boolean
  priceMode: "raw" | "psa10"
  onPriceModeChange: (mode: "raw" | "psa10") => void
  chartPeriod: string
  onChartPeriodChange: (period: string) => void
  chartStats: ChartStats | null
  onChartStatsChange: (period: string, stats: ChartStats | null) => void
  availableSources?: {
    id: string
    label: string
    source?: string
    grade?: string
    currency: "JPY" | "USD"
  }[]
  latestUpdatedAt?: string | null
  isStale: boolean
  maxDays: number
  lang: Language
}) {
  return (
    <div className="panel overflow-hidden">
      {hasPsa10 && (
        <div className="flex items-center gap-2.5 px-5 pt-4">
          <span className="text-xs font-medium text-muted-foreground">
            {t(lang, "condition")}
          </span>
          <div className="flex rounded-full border border-border bg-muted p-0.5">
            <button
              onClick={() => onPriceModeChange("raw")}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-semibold transition-all",
                priceMode === "raw"
                  ? "bg-background text-foreground shadow ring-1 ring-border"
                  : "text-muted-foreground hover:text-foreground/80",
              )}
            >
              Raw
            </button>
            <button
              onClick={() => onPriceModeChange("psa10")}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-all",
                priceMode === "psa10"
                  ? "bg-background text-foreground shadow ring-1 ring-border"
                  : "text-muted-foreground hover:text-foreground/80",
              )}
            >
              <Shield className="size-3.5 text-amber-500" />
              PSA 10
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 px-5 py-4 sm:grid-cols-2 sm:gap-px">
        <div className="pb-4 sm:pb-0">
          <p className="inline-flex items-center gap-1 text-meta">
            {t(lang, "marketPrice")}
            <Tooltip>
              <TooltipTrigger
                type="button"
                aria-label={t(lang, "marketPriceHelp")}
                className="inline-flex items-center text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              >
                <Info className="size-3" aria-hidden />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-[240px] leading-snug">
                  {t(lang, "marketPriceHelp")}
                </p>
              </TooltipContent>
            </Tooltip>
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            {priceMode === "raw" ? (
              <PriceDisplay
                priceJpy={card.price?.priceJpy}
                priceThb={card.price?.priceThb ?? undefined}
                size="lg"
                showChange={false}
              />
            ) : (
              <p className="font-price text-xl font-bold tabular-nums sm:text-3xl">
                {snkrdunkPrices?.psa10AskUsd != null ? (
                  <PriceUsd usd={snkrdunkPrices.psa10AskUsd} />
                ) : snkrdunkPrices?.psa10SoldUsd != null ? (
                  <PriceUsd usd={snkrdunkPrices.psa10SoldUsd} />
                ) : (
                  <span className="text-muted-foreground/40">—</span>
                )}
              </p>
            )}
            {priceMode === "raw" && chartStats && chartStats.change !== 0 && (
              <span
                className={cn(
                  "inline-flex items-center rounded-md px-1.5 py-0.5 font-price text-xs font-medium",
                  chartStats.change > 0
                    ? "bg-price-up/10 text-price-up"
                    : chartStats.change < 0
                      ? "bg-price-down/10 text-price-down"
                      : "text-muted-foreground",
                )}
              >
                {chartPeriod.toUpperCase()} {formatPctSmart(chartStats.change)}
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-meta">
            {priceMode === "raw" ? (
              <a
                href={yuyuteiSearchUrl(card)}
                target="_blank"
                rel="noopener nofollow"
                title={t(lang, "viewOnYuyutei")}
                className="inline-flex items-center gap-0.5 text-muted-foreground/70 hover:text-foreground hover:underline underline-offset-2"
              >
                Yuyu-tei
                <ExternalLink className="size-3" aria-hidden />
              </a>
            ) : (
              <a
                href={snkrdunkSearchUrl(card)}
                target="_blank"
                rel="noopener nofollow"
                title={t(lang, "checkOnSnkrdunk")}
                className="inline-flex items-center gap-0.5 text-muted-foreground/70 hover:text-foreground hover:underline underline-offset-2"
              >
                SNKRDUNK
                <ExternalLink className="size-3" aria-hidden />
              </a>
            )}
            {priceMode === "raw" && latestUpdatedAt && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span
                  className={cn(
                    "text-muted-foreground/70",
                    isStale && "text-amber-600 dark:text-amber-400",
                  )}
                >
                  {t(lang, "updatedAgo").replace(
                    "{ago}",
                    relativeTime(latestUpdatedAt, lang),
                  )}
                </span>
                {isStale && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-px font-medium text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="size-3" aria-hidden />
                    {t(lang, "dataMayBeStale")}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        <div className="border-t border-border/30 pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
          <p className="inline-flex items-center gap-1 text-meta">
            {t(lang, "lastSold")}
            <Tooltip>
              <TooltipTrigger
                type="button"
                aria-label={t(lang, "lastSoldHelp")}
                className="inline-flex items-center text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              >
                <Info className="size-3" aria-hidden />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-[240px] leading-snug">
                  {t(lang, "lastSoldHelp")}
                </p>
              </TooltipContent>
            </Tooltip>
          </p>
          {(() => {
            const usd =
              priceMode === "raw"
                ? snkrdunkPrices?.lastSoldUsd
                : snkrdunkPrices?.psa10SoldUsd
            if (usd != null) {
              return (
                <>
                  <p className="mt-1 font-price text-xl font-semibold tabular-nums text-foreground/85">
                    <PriceUsd usd={usd} />
                  </p>
                  <p className="mt-0.5 text-meta text-muted-foreground/60">
                    SNKRDUNK · {t(lang, "lastSoldRef")}
                  </p>
                </>
              )
            }
            return (
              <p className="mt-1 inline-flex items-center gap-1.5 font-price text-sm text-muted-foreground/70">
                {t(lang, "noSoldHistory")}
              </p>
            )
          })()}
        </div>
      </div>

      <div className="border-t border-border/30" />

      <div className="px-5 py-4">
        {card.chartData.length > 0 ? (
          <CardDetailPriceChart
            cardCode={card.cardCode}
            data={card.chartData}
            availableSources={availableSources}
            priceMode={priceMode}
            onPeriodChange={onChartPeriodChange}
            onStatsChange={({ period, stats }) => onChartStatsChange(period, stats)}
            initialPeriod={chartPeriod}
            maxDays={maxDays}
          />
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t(lang, "noPriceHistory")}
          </p>
        )}
      </div>
    </div>
  )
}

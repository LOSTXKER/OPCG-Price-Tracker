"use client"

import dynamic from "next/dynamic"
import {
  AlertTriangle,
  ExternalLink,
  Info,
  Shield,
} from "lucide-react"

import { PriceDisplay } from "@/components/shared/price-display"
import { PriceUsd } from "@/components/shared/price-usd"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { t, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { formatByCurrency, formatUsdByCurrency } from "@/lib/utils/currency"
import { relativeTime } from "@/lib/utils/time"
import { useUIStore } from "@/stores/ui-store"

const CardDetailPriceChart = dynamic(
  () => import("../card-detail-price-chart").then((m) => m.CardDetailPriceChart),
  {
    ssr: false,
    loading: () => <div className="h-[340px] animate-pulse rounded-xl bg-muted" />,
  },
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

type SourcePriceRow = {
  source: string
  askPriceJpy: number | null
  askPriceThb: number | null
  askPriceUsd: number | null
  soldPriceJpy: number | null
  soldPriceThb: number | null
  soldPriceUsd: number | null
  updatedAt: string | null
}

const SOURCE_META: Record<string, { label: string; color: string; searchUrl?: (code: string) => string }> = {
  YUYUTEI: {
    label: "Yuyu-tei",
    color: "bg-blue-500",
    searchUrl: (code) => `https://yuyu-tei.jp/sell/opc/?word=${encodeURIComponent(code)}`,
  },
  SNKRDUNK: {
    label: "SNKRDUNK",
    color: "bg-emerald-500",
    searchUrl: (code) => `https://snkrdunk.com/search?keyword=${encodeURIComponent(code)}`,
  },
  TCGPLAYER: { label: "TCGPlayer", color: "bg-orange-500" },
  CARDMARKET: { label: "Cardmarket", color: "bg-violet-500" },
  EBAY_JP: { label: "eBay JP", color: "bg-yellow-500" },
  MERCARI_JP: { label: "Mercari JP", color: "bg-rose-500" },
  MARKETPLACE: { label: "Marketplace", color: "bg-cyan-500" },
}

function formatSourcePrice(
  jpy: number | null,
  thb: number | null,
  usd: number | null,
  currency: "JPY" | "THB" | "USD",
): string {
  if (usd != null) return formatUsdByCurrency(usd, currency).primary
  if (jpy != null) return formatByCurrency(jpy, currency, thb).primary
  return "—"
}

export function CardPriceHub({
  card,
  snkrdunkPrices,
  hasPsa10,
  priceMode,
  onPriceModeChange,
  chartPeriod,
  onChartPeriodChange,
  availableSources,
  sourcePricesRaw,
  sourcePricesPsa10,
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
  availableSources?: {
    id: string
    label: string
    source?: string
    grade?: string
    currency: "JPY" | "USD"
  }[]
  sourcePricesRaw?: SourcePriceRow[]
  sourcePricesPsa10?: SourcePriceRow[]
  maxDays: number
  lang: Language
}) {
  const currency = useUIStore((s) => s.currency)

  const visibleSourceRows =
    priceMode === "psa10" ? sourcePricesPsa10 ?? [] : sourcePricesRaw ?? []
  const showSources = visibleSourceRows.length > 1
  const headlineJpy = priceMode === "raw" ? card.price?.priceJpy ?? null : null
  const cardCodeForSources = card.baseCode ?? card.cardCode

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
          <div className="mt-1">
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
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-meta">
            {priceMode === "raw" ? (
              <a
                href={yuyuteiSearchUrl(card)}
                target="_blank"
                rel="noopener nofollow"
                title={t(lang, "viewOnYuyutei")}
                className="inline-flex items-center gap-0.5 font-medium text-foreground/80 underline decoration-muted-foreground/30 decoration-dotted underline-offset-4 hover:text-foreground hover:decoration-foreground/60"
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
                className="inline-flex items-center gap-0.5 font-medium text-foreground/80 underline decoration-muted-foreground/30 decoration-dotted underline-offset-4 hover:text-foreground hover:decoration-foreground/60"
              >
                SNKRDUNK
                <ExternalLink className="size-3" aria-hidden />
              </a>
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
            initialPeriod={chartPeriod}
            maxDays={maxDays}
          />
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t(lang, "noPriceHistory")}
          </p>
        )}
      </div>

      {showSources && (
        <>
          <div className="border-t border-border/30" />
          <div className="px-5 pb-4 pt-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="text-eyebrow text-muted-foreground/70">
                {t(lang, "referenceMarkets")}
              </span>
              <span className="font-price text-xs text-muted-foreground/60">
                ({visibleSourceRows.length})
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border/30 text-eyebrow text-muted-foreground/60">
                      <th className="pb-2 pr-3 font-medium">{t(lang, "sourceRef")}</th>
                      <th className="pb-2 pr-3 text-right font-medium">{t(lang, "marketPrice")}</th>
                      <th className="pb-2 pr-3 text-right font-medium">{t(lang, "lastSold")}</th>
                      <th className="pb-2 text-right font-medium">{t(lang, "updated")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleSourceRows.map((row, i) => {
                      const meta =
                        SOURCE_META[row.source] ?? {
                          label: row.source,
                          color: "bg-muted-foreground",
                        }
                      const askStr = formatSourcePrice(
                        row.askPriceJpy,
                        row.askPriceThb,
                        row.askPriceUsd,
                        currency,
                      )
                      const soldStr = formatSourcePrice(
                        row.soldPriceJpy,
                        row.soldPriceThb,
                        row.soldPriceUsd,
                        currency,
                      )
                      const isBestAsk =
                        i === 0 && (row.askPriceJpy != null || row.askPriceUsd != null)
                      const outlier = isOutlier(row.askPriceJpy, headlineJpy)

                      return (
                        <tr
                          key={row.source}
                          className="border-b border-border/10 last:border-0"
                        >
                          <td className="py-2.5 pr-3">
                            {meta.searchUrl ? (
                              <a
                                href={meta.searchUrl(cardCodeForSources)}
                                target="_blank"
                                rel="noopener nofollow"
                                title={t(lang, "externalLink")}
                                className="flex items-center gap-2 hover:underline underline-offset-2"
                              >
                                <span
                                  className={cn(
                                    "size-2 shrink-0 rounded-full",
                                    meta.color,
                                  )}
                                />
                                <span className="text-xs font-medium">
                                  {meta.label}
                                </span>
                                <ExternalLink
                                  className="size-3 text-muted-foreground/50"
                                  aria-hidden
                                />
                              </a>
                            ) : (
                              <span className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    "size-2 shrink-0 rounded-full",
                                    meta.color,
                                  )}
                                />
                                <span className="text-xs font-medium">
                                  {meta.label}
                                </span>
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 pr-3 text-right">
                            <span className="inline-flex items-center justify-end gap-1">
                              {outlier && (
                                <Tooltip>
                                  <TooltipTrigger
                                    type="button"
                                    aria-label={t(lang, "priceOutlierWarn")}
                                    className="inline-flex items-center text-amber-500/80 hover:text-amber-500"
                                  >
                                    <AlertTriangle className="size-3" aria-hidden />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-[220px] leading-snug">
                                      {t(lang, "priceOutlierWarn")}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              <span
                                className={cn(
                                  "font-price text-xs font-semibold tabular-nums",
                                  outlier
                                    ? "text-amber-600 dark:text-amber-400"
                                    : isBestAsk
                                      ? "text-price-up"
                                      : "text-foreground",
                                  askStr === "—" && "text-muted-foreground/30",
                                )}
                              >
                                {askStr}
                              </span>
                            </span>
                          </td>
                          <td className="py-2.5 pr-3 text-right">
                            <span
                              className={cn(
                                "font-price text-xs tabular-nums",
                                soldStr === "—"
                                  ? "text-muted-foreground/30"
                                  : "text-foreground/80",
                              )}
                            >
                              {soldStr}
                            </span>
                          </td>
                          <td className="py-2.5 text-right text-meta text-muted-foreground/50">
                            {relativeTime(row.updatedAt, lang)}
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Reference threshold; a row whose ask differs from the headline by more than
// this proportion gets flagged as an outlier (kept in sync with the standalone
// SourceMarketsTable behaviour).
const OUTLIER_THRESHOLD = 0.5

function isOutlier(askJpy: number | null, headlineJpy: number | null) {
  if (askJpy == null || headlineJpy == null || headlineJpy <= 0) return false
  const ratio = Math.abs(askJpy - headlineJpy) / headlineJpy
  return ratio > OUTLIER_THRESHOLD
}

"use client"

import { AlertTriangle, ChevronDown, ExternalLink } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatByCurrency, formatUsdByCurrency } from "@/lib/utils/currency"
import { relativeTime } from "@/lib/utils/time"
import { t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { yuyuteiSearch, snkrdunkSearch } from "@/lib/constants/source-markets"

type SourceMeta = {
  label: string
  color: string
  /** Build a search URL for this source given a card code. */
  searchUrl?: (code: string) => string
}

const SOURCE_META: Record<string, SourceMeta> = {
  YUYUTEI: {
    label: "Yuyu-tei",
    color: "bg-blue-500",
    searchUrl: yuyuteiSearch,
  },
  SNKRDUNK: {
    label: "SNKRDUNK",
    color: "bg-emerald-500",
    searchUrl: snkrdunkSearch,
  },
  TCGPLAYER: { label: "TCGPlayer", color: "bg-orange-500" },
  CARDMARKET: { label: "Cardmarket", color: "bg-violet-500" },
  EBAY_JP: { label: "eBay JP", color: "bg-yellow-500" },
  MERCARI_JP: { label: "Mercari JP", color: "bg-rose-500" },
  MARKETPLACE: { label: "Marketplace", color: "bg-cyan-500" },
}

export interface SourcePriceRow {
  source: string
  askPriceJpy: number | null
  askPriceThb: number | null
  askPriceUsd: number | null
  soldPriceJpy: number | null
  soldPriceThb: number | null
  soldPriceUsd: number | null
  updatedAt: string | null
}

function formatPrice(
  jpy: number | null,
  thb: number | null,
  usd: number | null,
  currency: string,
): string {
  if (usd != null) return formatUsdByCurrency(usd, currency as "JPY" | "THB" | "USD").primary
  if (jpy != null) return formatByCurrency(jpy, currency as "JPY" | "THB" | "USD", thb).primary
  return "—"
}


/** Threshold (proportion) above/below which a row's ask is flagged as an
 * outlier vs the headline price. e.g. 0.5 means more than ±50% off. */
const OUTLIER_THRESHOLD = 0.5

function isOutlier(askJpy: number | null, headlineJpy: number | null) {
  if (askJpy == null || headlineJpy == null || headlineJpy <= 0) return false
  const ratio = Math.abs(askJpy - headlineJpy) / headlineJpy
  return ratio > OUTLIER_THRESHOLD
}

export function SourceMarketsTable({
  rows,
  cardCode,
  headlinePriceJpy,
}: {
  rows: SourcePriceRow[]
  /** Optional card code so each row can link out to a vendor's search page. */
  cardCode?: string
  /** Optional headline price (JPY) used as the reference baseline for
   * outlier detection. When provided, rows whose ask differs from this by
   * more than the outlier threshold are flagged with a warning icon. */
  headlinePriceJpy?: number | null
}) {
  const currency = useUIStore((s) => s.currency)
  const lang = useUIStore((s) => s.language)

  if (rows.length === 0) return null

  return (
    <details className="group panel overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30">
        <div className="min-w-0 flex items-center gap-2">
          <span className="text-eyebrow text-muted-foreground/70">
            {t(lang, "referenceMarkets")}
          </span>
          <span className="font-price text-xs text-muted-foreground/60">
            ({rows.length})
          </span>
        </div>
        <ChevronDown
          className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="border-t border-border/30 px-4 pb-4 pt-3">
        <p className="mb-3 text-meta text-muted-foreground/60">
          {t(lang, "referenceMarketsHint").replace("{n}", String(rows.length))}
        </p>
        {/* Mobile list */}
        <div className="divide-y divide-border/10 sm:hidden">
          {rows.map((row, i) => {
            const meta = SOURCE_META[row.source] ?? {
              label: row.source,
              color: "bg-muted-foreground",
            }
            const askStr = formatPrice(row.askPriceJpy, row.askPriceThb, row.askPriceUsd, currency)
            const soldStr = formatPrice(row.soldPriceJpy, row.soldPriceThb, row.soldPriceUsd, currency)
            const isBestAsk = i === 0 && (row.askPriceJpy != null || row.askPriceUsd != null)
            const outlier = isOutlier(row.askPriceJpy, headlinePriceJpy ?? null)
            const SourceLabel = (
              <span className="flex items-center gap-2">
                <span className={cn("size-2 shrink-0 rounded-full", meta.color)} />
                <span className="text-xs font-medium">{meta.label}</span>
                {meta.searchUrl && cardCode && (
                  <ExternalLink className="size-3 text-muted-foreground/50" aria-hidden />
                )}
              </span>
            )
            return (
              <div key={row.source} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <span className="w-5 shrink-0 text-center font-price text-xs text-muted-foreground/50">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  {meta.searchUrl && cardCode ? (
                    <a
                      href={meta.searchUrl(cardCode)}
                      target="_blank"
                      rel="noopener nofollow"
                      title={t(lang, "externalLink")}
                      className="inline-flex hover:underline underline-offset-2"
                    >
                      {SourceLabel}
                    </a>
                  ) : (
                    SourceLabel
                  )}
                  <p className="text-meta text-muted-foreground/50">
                    {relativeTime(row.updatedAt, lang)}
                  </p>
                </div>
                <div className="shrink-0 space-y-0.5 text-right">
                  <div className="inline-flex items-center justify-end gap-1">
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
                  </div>
                  {soldStr !== "—" && (
                    <p className="font-price text-xs tabular-nums text-muted-foreground">
                      {t(lang, "lastSold")}: {soldStr}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/30 text-eyebrow text-muted-foreground/60">
                <th className="pb-2 pr-3 font-medium">#</th>
                <th className="pb-2 pr-3 font-medium">{t(lang, "sourceRef")}</th>
                <th className="pb-2 pr-3 text-right font-medium">{t(lang, "marketPrice")}</th>
                <th className="pb-2 pr-3 text-right font-medium">{t(lang, "lastSold")}</th>
                <th className="pb-2 text-right font-medium">{t(lang, "updated")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const meta = SOURCE_META[row.source] ?? {
                  label: row.source,
                  color: "bg-muted-foreground",
                }
                const askStr = formatPrice(row.askPriceJpy, row.askPriceThb, row.askPriceUsd, currency)
                const soldStr = formatPrice(row.soldPriceJpy, row.soldPriceThb, row.soldPriceUsd, currency)
                const isBestAsk = i === 0 && (row.askPriceJpy != null || row.askPriceUsd != null)
                const outlier = isOutlier(row.askPriceJpy, headlinePriceJpy ?? null)

                return (
                  <tr
                    key={row.source}
                    className="border-b border-border/10 last:border-0"
                  >
                    <td className="py-2.5 pr-3 font-price text-xs text-muted-foreground/50">
                      {i + 1}
                    </td>
                    <td className="py-2.5 pr-3">
                      {meta.searchUrl && cardCode ? (
                        <a
                          href={meta.searchUrl(cardCode)}
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
                          <span className="text-xs font-medium">{meta.label}</span>
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
                          <span className="text-xs font-medium">{meta.label}</span>
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
    </details>
  )
}

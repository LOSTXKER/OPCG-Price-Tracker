"use client"

import type { Language } from "@/lib/i18n"
import {
  buildPriceHistoryCopy,
  formatSeoDate,
  priceHistoryLabels,
} from "@/lib/seo/copy/card"
import { changeToneClass, formatJpyAmount, formatSignedPct, type Currency } from "@/lib/utils/currency"

import { RANGE_DAYS, type ChartRange } from "./card-chart"
import { FeedScrollBox } from "./feed-scroll-box"
import type { PriceHistorySummary } from "./price-history"
import { PriceRangeControl } from "./price-range-control"

/**
 * Real, server-rendered price history — the block that replaced the fabricated
 * "sample sale history" feed. No "use client", no fetch: every row is in the
 * first HTML response for every user agent, which is the whole point (the chart
 * above it is client-only and invisible to crawlers).
 *
 * Table on ≥sm, list fallback under sm (AGENTS.md breakpoint rule).
 */
export function CardPriceHistory({
  cardCode,
  history,
  lang = "TH",
  currency = "THB",
  range = "1M",
  onRangeChange,
}: {
  cardCode: string
  history: PriceHistorySummary
  lang?: Language
  /** Display currency preference — the table shows ONE currency, the user's. */
  currency?: Currency
  /** Shared with the chart — the same selector, the same state, shown twice. */
  range?: ChartRange
  onRangeChange?: (range: ChartRange) => void
}) {
  // The range only decides how many of the already-delivered rows are visible.
  // SSR runs at the default 1M, so the full 30-row set is in the HTML for every
  // crawler no matter which range a visitor later picks — and nothing refetches.
  const points = history.points.slice(0, RANGE_DAYS[range])
  const latestDate = formatSeoDate(history.latestIso, lang)
  const copy = buildPriceHistoryCopy(lang, {
    cardCode,
    latestDate,
    pointCount: points.length,
  })
  const labels = priceHistoryLabels(lang)

  return (
    <div>
      <div className="mb-3 min-w-0">
        <h2 className="text-h3">{copy.title}</h2>
        <p className="text-body-sm mt-1 max-w-prose text-muted-foreground">{copy.lead}</p>
      </div>

      {onRangeChange && history.points.length > 1 && (
        // Left-aligned under the lead (owner decision). No "ช่วงเวลา" label: the
        // pills already read as a range, and the label only pushed the control
        // to the far side of the block. Scrolls sideways on a narrow phone, the
        // same way the grade rail does (AGENTS.md).
        <div className="no-sb mb-5 max-w-full overflow-x-auto pb-1">
          <PriceRangeControl
            lang={lang}
            range={range}
            onRangeChange={onRangeChange}
            className="shrink-0"
          />
        </div>
      )}

      {points.length === 0 ? (
        <p className="text-meta py-6 text-center">{copy.emptyText}</p>
      ) : (
        <>
          {/* The 7/30/90-day summary was removed at the owner's request: every
              figure in it was derived from the daily rows below, so it repeated
              what the page already showed. `derivePriceHistory` still computes
              `history.windows` (covered by tests) in case it comes back. */}

          {/* One currency only — the visitor's preference (owner decision). The
              yen figure used to sit under every ฿ value and doubled the height
              of the table for provenance the page states once already. */}
          <FeedScrollBox className="hidden sm:block">
            <table className="w-full table-fixed border-collapse">
              <thead className="sticky top-0 z-10 bg-background">
                <tr className="text-eyebrow border-b border-hair">
                  <th scope="col" className="w-2/5 py-2.5 pl-1 pr-3 text-left">{labels.date}</th>
                  <th scope="col" className="py-2.5 pl-2 pr-3 text-right">{labels.priceThb}</th>
                  <th scope="col" className="w-1/5 py-2.5 pl-2 pr-1 text-right">{labels.changeCol}</th>
                </tr>
              </thead>
              <tbody>
                {points.map((p) => (
                  <tr key={p.dateIso} className="hover:bg-muted/40">
                    <th scope="row" className="tnum py-3 pl-1 pr-3 text-left text-body-sm font-normal text-muted-foreground">
                      {formatSeoDate(p.dateIso, lang)}
                    </th>
                    <td className="text-price py-3 pl-2 pr-3 text-right text-foreground">
                      {formatJpyAmount(p.priceJpy, currency)}
                    </td>
                    <td className={`tnum py-3 pl-2 pr-1 text-right text-body-sm ${changeToneClass(p.changePct)}`}>
                      {p.changePct != null ? formatSignedPct(p.changePct) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </FeedScrollBox>

          <FeedScrollBox variant="list" className="px-1 sm:hidden">
            {points.map((p) => (
              <div key={p.dateIso} className="flex items-center justify-between gap-3 py-3">
                <span className="min-w-0">
                  <span className="tnum block text-body-sm text-muted-foreground">
                    {formatSeoDate(p.dateIso, lang)}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="text-price block text-foreground">
                    {formatJpyAmount(p.priceJpy, currency)}
                  </span>
                  <span className={`tnum text-meta mt-0.5 block ${changeToneClass(p.changePct)}`}>
                    {p.changePct != null ? formatSignedPct(p.changePct) : "—"}
                  </span>
                </span>
              </div>
            ))}
          </FeedScrollBox>
        </>
      )}
    </div>
  )
}

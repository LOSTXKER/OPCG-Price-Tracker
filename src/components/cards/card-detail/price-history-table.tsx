"use client"

import { useState } from "react"

import { t, type Language } from "@/lib/i18n"
import {
  buildPriceHistoryCopy,
  formatSeoDate,
  priceHistoryLabels,
} from "@/lib/seo/copy/card"
import { changeToneClass, formatJpy, formatSignedPct, formatThb } from "@/lib/utils/currency"

import { FeedScrollBox } from "./feed-scroll-box"
import { ConditionFilter } from "./market-feed-shared"
import type { PriceHistorySummary } from "./price-history"

/** Local period options (days). "all" = every row that was derived. */
const HISTORY_PERIODS = ["7", "30"]

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
}: {
  cardCode: string
  history: PriceHistorySummary
  lang?: Language
}) {
  // Own control, like every other block on this page. It used to follow the
  // chart's range pills, but those sit a long way up the page — a control you
  // cannot see while reading the table is not a control.
  const [period, setPeriod] = useState<string>("all")

  // Every derived row ships in the HTML and the period only hides rows, so a
  // crawler always sees the full set (default "all"). Nothing is refetched.
  const points =
    period === "all" ? history.points : history.points.slice(0, Number(period))
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
        <p className="text-body-sm mt-1 text-muted-foreground">{copy.lead}</p>
      </div>

      {history.points.length > 1 && (
        <div className="mb-4">
          <ConditionFilter
            label={t(lang, "salePeriodFilter")}
            grades={HISTORY_PERIODS}
            active={period}
            onSelect={setPeriod}
            render={(v) =>
              v === "all" ? t(lang, "filterAll") : t(lang, "saleWithinDays").replace("{n}", v)
            }
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

          {/* ฿ and ¥ share one cell — the yen figure is provenance, not a value
              to compare down a column, and giving it equal weight made four
              columns of numbers with no clear reading order. */}
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
                  <tr
                    key={p.dateIso}
                    className="border-b border-hair last:border-b-0 hover:bg-muted/40"
                  >
                    <th scope="row" className="tnum py-2.5 pl-1 pr-3 text-left text-label font-medium text-foreground">
                      {formatSeoDate(p.dateIso, lang)}
                    </th>
                    <td className="py-2.5 pl-2 pr-3 text-right">
                      <span className="tnum block text-label font-semibold text-foreground">
                        {formatThb(p.priceThb)}
                      </span>
                      <span className="tnum text-meta block">{formatJpy(p.priceJpy)}</span>
                    </td>
                    <td className={`tnum py-2.5 pl-2 pr-1 text-right text-label ${changeToneClass(p.changePct)}`}>
                      {p.changePct != null ? formatSignedPct(p.changePct) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </FeedScrollBox>

          <FeedScrollBox variant="list" className="divide-y divide-hair px-1 sm:hidden">
            {points.map((p) => (
              <div key={p.dateIso} className="flex items-center justify-between gap-3 py-3">
                <span className="min-w-0">
                  <span className="tnum block text-label font-medium text-foreground">
                    {formatSeoDate(p.dateIso, lang)}
                  </span>
                  <span className="tnum text-meta mt-0.5 block">{formatJpy(p.priceJpy)}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="tnum block text-label font-semibold text-foreground">
                    {formatThb(p.priceThb)}
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

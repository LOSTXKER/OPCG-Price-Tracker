import type { Language } from "@/lib/i18n"
import {
  buildPriceHistoryCopy,
  formatSeoDate,
  priceHistoryLabels,
} from "@/lib/seo/copy/card"
import { changeToneClass, formatJpy, formatSignedPct, formatThb } from "@/lib/utils/currency"

import type { PriceHistorySummary } from "./price-history"

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
  const latestDate = formatSeoDate(history.latestIso, lang)
  const copy = buildPriceHistoryCopy(lang, {
    cardCode,
    latestDate,
    pointCount: history.points.length,
  })
  const labels = priceHistoryLabels(lang)

  return (
    <div>
      <div className="mb-3 min-w-0">
        <h2 className="text-h3">{copy.title}</h2>
        <p className="text-body-sm mt-1 text-muted-foreground">{copy.lead}</p>
      </div>

      {history.points.length === 0 ? (
        <p className="text-meta py-6 text-center">{copy.emptyText}</p>
      ) : (
        <>
          {/* Windows as stat tiles, not a second table: two identically-styled
              tables stacked read as one long grey slab and the eye cannot tell
              the summary from the daily rows. Tiles are scannable and give the
              section a shape. */}
          {history.windows.length > 0 && (
            <div className="mb-7">
              <h3 className="text-h5 mb-2.5">{copy.windowsTitle}</h3>
              <div className="grid gap-2.5 sm:grid-cols-3">
                {history.windows.map((w) => (
                  <div
                    key={w.days}
                    className="surface-1 rounded-xl hairline px-4 py-3.5"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-label font-medium text-foreground">
                        {labels.days(w.days)}
                      </p>
                      <p className="text-meta">{labels.samples(w.count)}</p>
                    </div>
                    <p className="tnum mt-2 text-h4 font-semibold text-foreground">
                      {formatThb(w.avgThb)}
                    </p>
                    <p className="text-meta mt-0.5">{labels.avg}</p>
                    <p className="tnum text-meta mt-2 border-t border-hair pt-2">
                      {formatThb(w.lowThb)} – {formatThb(w.highThb)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h3 className="text-h5 mb-2">{copy.recentTitle}</h3>

          {/* ฿ and ¥ share one cell — the yen figure is provenance, not a value
              to compare down a column, and giving it equal weight made four
              columns of numbers with no clear reading order. */}
          <div className="hidden sm:block">
            <table className="w-full table-fixed border-collapse">
              <thead>
                <tr className="text-eyebrow border-b border-hair">
                  <th scope="col" className="w-2/5 py-2.5 pl-1 pr-3 text-left">{labels.date}</th>
                  <th scope="col" className="py-2.5 pl-2 pr-3 text-right">{labels.priceThb}</th>
                  <th scope="col" className="w-1/5 py-2.5 pl-2 pr-1 text-right">{labels.changeCol}</th>
                </tr>
              </thead>
              <tbody>
                {history.points.map((p) => (
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
          </div>

          <div className="divide-y divide-hair px-1 sm:hidden">
            {history.points.map((p) => (
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
          </div>
        </>
      )}
    </div>
  )
}

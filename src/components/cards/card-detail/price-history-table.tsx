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
          {history.windows.length > 0 && (
            <div className="mb-6">
              <h3 className="text-h5 mb-2">{copy.windowsTitle}</h3>

              <div className="hidden sm:block">
                <table className="w-full table-fixed border-collapse">
                  <thead className="bg-background">
                    <tr className="text-eyebrow border-b border-hair">
                      <th scope="col" className="py-2.5 pl-1 pr-3 text-left">{labels.window}</th>
                      <th scope="col" className="py-2.5 pl-2 pr-3 text-right">{labels.low}</th>
                      <th scope="col" className="py-2.5 pl-2 pr-3 text-right">{labels.high}</th>
                      <th scope="col" className="py-2.5 pl-2 pr-1 text-right">{labels.avg}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.windows.map((w) => (
                      <tr key={w.days} className="border-b border-hair last:border-b-0">
                        <th scope="row" className="py-3 pl-1 pr-3 text-left text-label font-medium text-foreground">
                          {labels.days(w.days)}
                          <span className="text-meta ml-2">{labels.samples(w.count)}</span>
                        </th>
                        <td className="tnum py-3 pl-2 pr-3 text-right text-label text-foreground">
                          {formatThb(w.lowThb)}
                        </td>
                        <td className="tnum py-3 pl-2 pr-3 text-right text-label text-foreground">
                          {formatThb(w.highThb)}
                        </td>
                        <td className="tnum py-3 pl-2 pr-1 text-right text-label font-semibold text-foreground">
                          {formatThb(w.avgThb)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-hair px-1 sm:hidden">
                {history.windows.map((w) => (
                  <div key={w.days} className="py-3">
                    <p className="text-label font-medium text-foreground">{labels.days(w.days)}</p>
                    <p className="tnum text-meta mt-0.5">
                      {labels.low} {formatThb(w.lowThb)} · {labels.high} {formatThb(w.highThb)} ·{" "}
                      {labels.avg} {formatThb(w.avgThb)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h3 className="text-h5 mb-2">{copy.recentTitle}</h3>

          <div className="hidden sm:block">
            <table className="w-full table-fixed border-collapse">
              <thead className="bg-background">
                <tr className="text-eyebrow border-b border-hair">
                  <th scope="col" className="py-2.5 pl-1 pr-3 text-left">{labels.date}</th>
                  <th scope="col" className="py-2.5 pl-2 pr-3 text-right">{labels.priceThb}</th>
                  <th scope="col" className="py-2.5 pl-2 pr-3 text-right">{labels.priceJpy}</th>
                  <th scope="col" className="py-2.5 pl-2 pr-1 text-right">{labels.changeCol}</th>
                </tr>
              </thead>
              <tbody>
                {history.points.map((p) => (
                  <tr key={p.dateIso} className="border-b border-hair last:border-b-0">
                    <th scope="row" className="tnum py-3 pl-1 pr-3 text-left text-label font-medium text-foreground">
                      {formatSeoDate(p.dateIso, lang)}
                    </th>
                    <td className="tnum py-3 pl-2 pr-3 text-right text-label font-semibold text-foreground">
                      {formatThb(p.priceThb)}
                    </td>
                    <td className="tnum py-3 pl-2 pr-3 text-right text-label text-muted-foreground">
                      {formatJpy(p.priceJpy)}
                    </td>
                    <td className={`tnum py-3 pl-2 pr-1 text-right text-label ${changeToneClass(p.changePct)}`}>
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

"use client"

import { BadgeCheck } from "lucide-react"

import { formatByCurrency, formatUsdByCurrency, type Currency } from "@/lib/utils/currency"
import { relativeTime } from "@/lib/utils/time"
import { t, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"

import { SourceLogo, sourceLabel } from "./source-logo"

/** One per-source market quote (latest ask + sold for that source). */
export type MarketRow = {
  source: string
  askPriceJpy: number | null
  askPriceThb: number | null
  askPriceUsd: number | null
  soldPriceJpy: number | null
  soldPriceThb: number | null
  soldPriceUsd: number | null
  updatedAt: string | null
}

/**
 * "แหล่งอ้างอิง" — per-source ask|sold table below the chart (full width). Ask =
 * listing (muted); Sold = settled value (foreground). Native ¥/$ under the display
 * currency. Sort toggle appears only with ≥4 sources. Pure presentation: `rows`
 * arrive pre-filtered + pre-sorted from the parent; sort STATE lives in the parent
 * (it drives the row memo), so this just reflects it.
 */
export function MarketsTable({
  rows,
  gradeLabel,
  currency,
  lang,
  hydrated,
  sort,
  onSortChange,
}: {
  rows: MarketRow[]
  gradeLabel: string
  currency: Currency
  lang: Language
  hydrated: boolean
  sort: "price" | "fresh"
  onSortChange: (sort: "price" | "fresh") => void
}) {
  // {primary: display currency, secondary: native ¥/$ when display = THB}.
  const askCell = (r: MarketRow) =>
    r.askPriceUsd != null ? formatUsdByCurrency(r.askPriceUsd, currency) : r.askPriceJpy != null ? formatByCurrency(r.askPriceJpy, currency, r.askPriceThb) : null
  const soldCell = (r: MarketRow) =>
    r.soldPriceUsd != null ? formatUsdByCurrency(r.soldPriceUsd, currency) : r.soldPriceJpy != null ? formatByCurrency(r.soldPriceJpy, currency, r.soldPriceThb) : null

  return (
    <section id="sources" className="mt-8 scroll-mt-20">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-eyebrow">{t(lang, "referenceSources")} · {gradeLabel}</p>
          <p className="text-meta mt-0.5">{t(lang, "marketEvidenceDesc")}</p>
        </div>
        {rows.length >= 4 && (
          <div className="inline-flex gap-0.5 rounded-full bg-foreground/[0.045] p-0.5 ring-1 ring-[var(--p-hair)]">
            {([["price", t(lang, "sortByPrice")], ["fresh", t(lang, "sortByFresh")]] as const).map(([k, label]) => (
              <button key={k} type="button" aria-pressed={sort === k} onClick={() => onSortChange(k)} className={cn("ease-chrome rounded-full px-2.5 py-1.5 text-xs font-semibold", sort === k ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}>{label}</button>
            ))}
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl bg-foreground/[0.025] p-4">
          <p className="text-sm font-semibold text-foreground">{t(lang, "noLatestListings")}</p>
          <p className="text-meta mt-1">{t(lang, "notEnoughDataYet")}</p>
        </div>
      ) : (
        <>
          {/* desktop table (≥sm) */}
          <div className="hidden overflow-hidden rounded-xl hairline sm:block">
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-eyebrow border-b border-[var(--p-hair)] bg-foreground/[0.02]">
                  <th className="px-3 py-2 text-left font-medium">{t(lang, "sourceCol")}</th>
                  <th className="px-3 py-2 text-right font-medium">{t(lang, "asksTab")}</th>
                  <th className="px-3 py-2 text-right font-medium">{t(lang, "soldTab")}</th>
                  <th className="px-3 py-2 text-right font-medium">{t(lang, "updatedCol")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const ask = askCell(r)
                  const sold = soldCell(r)
                  return (
                    <tr key={r.source} className="border-b border-[var(--p-hair)] last:border-b-0">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background/50 ring-1 ring-[var(--p-hair)]">
                            <SourceLogo source={r.source} size={20} />
                          </span>
                          <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                            {sourceLabel(r.source)}
                            <BadgeCheck className="size-3 text-muted-foreground" aria-hidden />
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {ask ? (
                          <>
                            <span className="text-price block text-muted-foreground">{ask.primary}</span>
                            <span className="text-overlay tnum text-muted-foreground/60">{ask.secondary}</span>
                          </>
                        ) : (
                          <span className="text-meta">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {sold ? (
                          <>
                            <span className="text-price block text-foreground">{sold.primary}</span>
                            <span className="text-overlay tnum text-muted-foreground/60">{sold.secondary}</span>
                          </>
                        ) : (
                          <span className="text-meta">{t(lang, "noLatestSales")}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="text-meta tnum">{hydrated && r.updatedAt ? relativeTime(r.updatedAt, lang) : "—"}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* mobile list (<sm) */}
          <div className="divide-y divide-[var(--p-hair)] overflow-hidden rounded-xl hairline sm:hidden">
            {rows.map((r) => {
              const ask = askCell(r)
              const sold = soldCell(r)
              return (
                <div key={r.source} className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background/50 ring-1 ring-[var(--p-hair)]">
                      <SourceLogo source={r.source} size={20} />
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-semibold text-foreground">{sourceLabel(r.source)}</span>
                    <span className="text-meta tnum shrink-0">{hydrated && r.updatedAt ? relativeTime(r.updatedAt, lang) : ""}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-foreground/[0.03] px-2.5 py-1.5">
                      <p className="text-overlay text-muted-foreground">{t(lang, "asksTab")}</p>
                      {ask ? <p className="text-price text-muted-foreground">{ask.primary}</p> : <p className="text-meta">—</p>}
                    </div>
                    <div className="rounded-lg bg-foreground/[0.03] px-2.5 py-1.5">
                      <p className="text-overlay text-muted-foreground">{t(lang, "soldTab")}</p>
                      {sold ? <p className="text-price text-foreground">{sold.primary}</p> : <p className="text-meta">{t(lang, "noLatestSales")}</p>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* legend — ask vs sold doctrine: a listing is not a settled value */}
          <div className="text-meta mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-foreground" /> <b className="font-semibold text-foreground">{t(lang, "soldTab")}</b> {t(lang, "soldLegend")}</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-muted-foreground/40" /> {t(lang, "asksTab")} {t(lang, "askLegend")}</span>
          </div>
        </>
      )}
    </section>
  )
}

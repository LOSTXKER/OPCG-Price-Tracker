"use client"

import { t, type Language } from "@/lib/i18n"
import { formatDisplayValue } from "@/lib/utils/currency"
import { useUIStore } from "@/stores/ui-store"

import { type GradeDatum, type GradeKey } from "./grades"
import { GradeValue, Amount, Delta, EstMark } from "./grade-value"
import { EditionToggle, type Edition } from "./edition-toggle"

export type PriceScrubSnapshot = {
  value: number
  dateLabel: string
  deltaPct: number
} | null

/**
 * Header price block — the single top focal point (TradingView / Coinbase): the
 * price sits right under the name. The grade selector now lives WITH the chart
 * (the series axis); edition (JP/EN) — a page-level axis that reshapes every
 * grade — stays here by identity. Selecting a grade at the chart re-prices this.
 */
export function CardPriceHeader({
  gradeData,
  selectedGrade,
  edition,
  onEditionChange,
  enAvailable = false,
  scrubSnapshot = null,
  lowestAskAboveRange = false,
  marketAveragePct = null,
  lang,
}: {
  gradeData: Record<GradeKey, GradeDatum>
  selectedGrade: GradeKey
  edition: Edition
  onEditionChange: (e: Edition) => void
  enAvailable?: boolean
  scrubSnapshot?: PriceScrubSnapshot
  lowestAskAboveRange?: boolean
  marketAveragePct?: number | null
  lang: Language
}) {
  const currency = useUIStore((s) => s.currency)
  const datum = gradeData[selectedGrade]
  const shownDelta = scrubSnapshot?.deltaPct ?? datum.delta30d?.pct ?? null
  const averageNote =
    marketAveragePct != null
      ? t(lang, "marketAverageNote").replace("{pct}", `${marketAveragePct > 0 ? "+" : ""}${marketAveragePct.toFixed(1)}%`)
      : null

  return (
    <div>
      <p className="text-eyebrow">{scrubSnapshot?.dateLabel ?? `${t(lang, "marketPrice")} · ${datum.tier.label}`}</p>
      <div key={selectedGrade} className="rise flex flex-wrap items-end gap-x-3 gap-y-1">
        {scrubSnapshot ? (
          <span className="tnum text-display text-foreground">{formatDisplayValue(scrubSnapshot.value, currency)}</span>
        ) : (
          <GradeValue datum={datum} size="hero" className="text-foreground" />
        )}
        {shownDelta != null && (
          <span className="flex items-center pb-1.5">
            <Delta pct={shownDelta} lang={lang} size="lg" />
            <span className="ml-1.5 text-sm text-muted-foreground">
              {scrubSnapshot ? t(lang, "fromRangeOpen") : t(lang, "days30")}
            </span>
          </span>
        )}
      </div>
      <p className="text-meta mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <span>{datum.lastSaleSource ?? t(lang, "sourceRef")}</span>
        {datum.sales30d != null && <span>· {datum.sales30d.toLocaleString()} {t(lang, "sales30d")}</span>}
        {averageNote && <span>· {averageNote}</span>}
        {datum.value.isEst && <EstMark lang={lang} />}
      </p>

      <dl className="mt-3 grid grid-cols-3 overflow-hidden rounded-xl surface-1 hairline">
        <div className="min-w-0 px-3 py-2.5">
          <dt className="text-overlay uppercase text-muted-foreground">{t(lang, "lastSold")}</dt>
          <dd className="mt-0.5 flex items-center gap-1">
            <Amount jpy={datum.lastSale.jpy} usd={datum.lastSale.usd} size="stat" className="text-foreground" />
            {datum.lastSale.isEst && <EstMark lang={lang} />}
          </dd>
        </div>
        <div className="min-w-0 px-3 py-2.5" style={{ boxShadow: "inset 1px 0 0 0 var(--p-hair)" }}>
          <dt className="text-overlay uppercase text-muted-foreground">{t(lang, "lowestAsk")}</dt>
          <dd className="mt-0.5 flex items-center gap-1">
            <Amount jpy={datum.lowestAsk.jpy} usd={datum.lowestAsk.usd} size="stat" className="text-foreground" />
            {datum.lowestAsk.isEst && <EstMark lang={lang} />}
          </dd>
          {lowestAskAboveRange && (
            <p className="text-overlay mt-1 text-muted-foreground">{t(lang, "askAboveMarketSingleSeller")}</p>
          )}
        </div>
        <div className="min-w-0 px-3 py-2.5" style={{ boxShadow: "inset 1px 0 0 0 var(--p-hair)" }}>
          <dt className="text-overlay uppercase text-muted-foreground">{t(lang, "sales30d")}</dt>
          <dd className="tnum mt-0.5 text-sm font-bold text-foreground">
            {datum.sales30d == null ? "—" : datum.sales30d.toLocaleString()}
          </dd>
        </div>
      </dl>

      {/* edition (JP/EN) — page-level axis; the grade selector lives at the chart */}
      <div className="mt-3 flex items-center">
        <EditionToggle value={edition} onChange={onEditionChange} enAvailable={enAvailable} />
      </div>
    </div>
  )
}

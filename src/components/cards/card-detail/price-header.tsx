"use client"

import { t, type Language } from "@/lib/i18n"

import { type GradeDatum, type GradeKey } from "./grades"
import { GradeValue, Amount, Delta } from "./grade-value"
import { EditionToggle, type Edition } from "./edition-toggle"

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
  lang,
}: {
  gradeData: Record<GradeKey, GradeDatum>
  selectedGrade: GradeKey
  edition: Edition
  onEditionChange: (e: Edition) => void
  enAvailable?: boolean
  lang: Language
}) {
  const datum = gradeData[selectedGrade]

  return (
    <div>
      <div key={selectedGrade} className="rise flex flex-wrap items-end gap-x-3 gap-y-1">
        <GradeValue datum={datum} size="hero" className="text-foreground" />
        {datum.delta30d && (
          <span className="flex items-center pb-1.5">
            <Delta pct={datum.delta30d.pct} lang={lang} size="lg" />
            <span className="ml-1.5 text-sm text-muted-foreground">{t(lang, "days30")}</span>
          </span>
        )}
      </div>
      <p className="text-meta mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <span className="inline-flex items-center gap-1">
          {t(lang, "lastSold")}
          <Amount jpy={datum.lastSale.jpy} usd={datum.lastSale.usd} size="xs" className="text-foreground/70" />
        </span>
        {datum.sales30d != null && <span>· {datum.sales30d.toLocaleString()} {t(lang, "sales30d")}</span>}
      </p>

      {/* edition (JP/EN) — page-level axis; the grade selector lives at the chart */}
      <div className="mt-3 flex items-center">
        <EditionToggle value={edition} onChange={onEditionChange} enAvailable={enAvailable} />
      </div>
    </div>
  )
}

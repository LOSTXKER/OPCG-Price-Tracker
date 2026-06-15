"use client"

import { Fragment, useState } from "react"
import { ChevronDown, Shield } from "lucide-react"

import { t, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"

import { GRADE_TIERS, type GradeDatum, type GradeKey } from "./grades"
import { GradeValue, Amount, Delta } from "./grade-value"
import { EditionToggle, type Edition } from "./edition-toggle"

/** Less-common grades, collapsed behind a "more grades" toggle. */
const SECONDARY_GRADES = new Set<GradeKey>(["raw_b", "raw_c", "bgs_95"])

/**
 * Header price block — the single top focal point (TradingView / Coinbase): the
 * price sits right under the name, and the GRADE selector sits right under the
 * price (grade is picked often, so its result — the price — is adjacent, no eye
 * travel). Edition (JP/EN) is rarely changed, so it stays small to the side.
 */
export function CardPriceHeader({
  gradeData,
  selectedGrade,
  onSelectGrade,
  edition,
  onEditionChange,
  enAvailable = false,
  lang,
}: {
  gradeData: Record<GradeKey, GradeDatum>
  selectedGrade: GradeKey
  onSelectGrade: (key: GradeKey) => void
  edition: Edition
  onEditionChange: (e: Edition) => void
  enAvailable?: boolean
  lang: Language
}) {
  const datum = gradeData[selectedGrade]
  const tier = datum.tier
  const [showAllGrades, setShowAllGrades] = useState(false)
  const visibleTiers = GRADE_TIERS.filter(
    (gt) => !SECONDARY_GRADES.has(gt.key) || showAllGrades || gt.key === selectedGrade,
  )

  return (
    <div>
      <p className="text-eyebrow">{tier.label} · {edition} · {t(lang, "marketPrice")}</p>
      <div key={selectedGrade} className="rise mt-0.5 flex flex-wrap items-end gap-x-3 gap-y-1">
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

      {/* instrument — grade right under the price; edition small at the side */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <EditionToggle value={edition} onChange={onEditionChange} enAvailable={enAvailable} />
        <span className="mx-0.5 hidden h-5 w-px bg-[var(--p-hair)] sm:block" aria-hidden />
        <div className="no-sb flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-0.5" role="group" aria-label={t(lang, "chooseGrade")}>
          {visibleTiers.map((gt, i) => {
            const prev = visibleTiers[i - 1]
            const groupBreak = prev && prev.family === "raw" && gt.family !== "raw"
            const d = gradeData[gt.key]
            const active = gt.key === selectedGrade
            const disabled = !d.hasData && !active
            return (
              <Fragment key={gt.key}>
                {groupBreak && <span aria-hidden className="h-5 w-px shrink-0 bg-[var(--p-hair)]" />}
                <button
                  type="button"
                  aria-pressed={active}
                  disabled={disabled}
                  onClick={() => onSelectGrade(gt.key)}
                  className={cn(
                    "ease-chrome inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
                    active
                      ? "bg-foreground/10 text-foreground ring-1 ring-foreground/15"
                      : "surface-1 hairline text-muted-foreground hover:text-foreground",
                    disabled && "cursor-not-allowed opacity-40",
                  )}
                >
                  {gt.family !== "raw" && <Shield className="size-3" aria-hidden />}
                  {gt.short}
                </button>
              </Fragment>
            )
          })}

          <button
            type="button"
            aria-expanded={showAllGrades}
            onClick={() => setShowAllGrades((v) => !v)}
            className="ease-chrome surface-1 hairline flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
          >
            {t(lang, "moreGrades")}
            <ChevronDown className={cn("ease-chrome size-3.5 transition-transform", showAllGrades && "rotate-180")} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}

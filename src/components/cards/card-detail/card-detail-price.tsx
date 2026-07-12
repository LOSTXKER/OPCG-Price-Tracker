"use client"

import { Fragment, type RefObject, type ReactNode } from "react"

import { HeroNumber } from "@/components/ui/hero-number"
import { compactDisplayValue, formatDisplayValue } from "@/lib/utils/currency"
import { t, type Currency, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"

import type { ChartRange } from "./card-chart"
import { EditionToggle, type Edition } from "./edition-toggle"
import { Delta, EstMark } from "./grade-value"
import { GradeLogo } from "./grade-logo"
import { GRADE_TIERS, type GradeDatum, type GradeKey } from "./grades"
import { SourceLogo, sourceLabel } from "./source-logo"
import type { ProvenanceModel } from "./use-card-detail-model"

interface CardDetailPriceProps {
  hydrated: boolean
  lang: Language
  currency: Currency
  edition: Edition
  onEditionChange: (edition: Edition) => void
  range: ChartRange
  activeIndex: number | null
  gradeActiveRef: RefObject<HTMLButtonElement | null>
  gradeData: Record<GradeKey, GradeDatum>
  gradeDisplayValues: Record<GradeKey, number | null>
  selectedGrade: GradeKey
  onGradeChange: (grade: GradeKey) => void
  datum: GradeDatum
  activeValue: number | null
  shownDelta: number | null
  shownDate: string | null
  windowLabel: string
  priceLow: number | null
  priceHigh: number | null
  pricePos: number
  provenance: ProvenanceModel | null
}

/** Grade selector and the selected grade's headline price instrument. */
export function CardDetailPrice({
  hydrated,
  lang,
  currency,
  edition,
  onEditionChange,
  range,
  activeIndex,
  gradeActiveRef,
  gradeData,
  gradeDisplayValues,
  selectedGrade,
  onGradeChange,
  datum,
  activeValue,
  shownDelta,
  shownDate,
  windowLabel,
  priceLow,
  priceHigh,
  pricePos,
  provenance,
}: CardDetailPriceProps) {
  const provenanceParts: ReactNode[] = []
  if (provenance) {
    provenanceParts.push(
      <span
        key="kind"
        className="inline-flex items-center rounded-full px-2 py-0.5 text-micro font-semibold leading-none"
        style={{
          background: `color-mix(in srgb, ${provenance.kindColor} 16%, transparent)`,
          color: provenance.kindColor,
        }}
      >
        {provenance.kindLabel}
      </span>,
      <span
        key="src"
        className="inline-flex items-center gap-1 whitespace-nowrap font-medium text-foreground/80"
      >
        <span className="font-normal text-muted-foreground">
          {provenance.referenceLabel}
        </span>
        <SourceLogo source={provenance.sourceCode} size={13} />
        {sourceLabel(provenance.sourceCode)}
      </span>,
    )
  }

  return (
    <>
      <div className="mt-4 space-y-2">
        <EditionToggle value={edition} onChange={onEditionChange} enAvailable={false} />
        <div
          role="group"
          aria-label={t(lang, "chooseGrade")}
          className="no-sb -mx-1 flex items-stretch gap-1 overflow-x-auto px-1"
        >
          {GRADE_TIERS.map((tier, index) => {
            const gradeDatum = gradeData[tier.key]
            const active = tier.key === selectedGrade
            const disabled = !gradeDatum.hasData && !active
            const graded = tier.family !== "raw"
            const label = graded
              ? tier.short.replace(/^(PSA|BGS|CGC)\s*/i, "")
              : tier.short
            const dividerBefore =
              graded && GRADE_TIERS[index - 1]?.family === "raw"
            const hint = gradeDisplayValues[tier.key]

            return (
              <Fragment key={tier.key}>
                {dividerBefore && (
                  <span
                    aria-hidden
                    className="mx-0.5 w-px shrink-0 self-stretch bg-hair"
                  />
                )}
                <button
                  type="button"
                  ref={active ? gradeActiveRef : undefined}
                  aria-pressed={active}
                  aria-label={tier.label}
                  disabled={disabled}
                  onClick={() => onGradeChange(tier.key)}
                  className={cn(
                    "ease-chrome flex min-h-11 shrink-0 flex-col items-start justify-center gap-0.5 rounded-lg px-2.5 py-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-0",
                    active
                      ? "bg-foreground/10 text-foreground"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                    disabled && "cursor-not-allowed opacity-40",
                  )}
                >
                  <span className="text-label flex items-center gap-1 font-semibold">
                    {graded && <GradeLogo family={tier.family} size={12} />}
                    {label}
                  </span>
                  <span
                    className={cn(
                      "text-meta tnum",
                      active ? "text-foreground/75" : "text-muted-foreground",
                    )}
                  >
                    {hint != null ? compactDisplayValue(hint, currency) : "—"}
                  </span>
                </button>
              </Fragment>
            )
          })}
        </div>
      </div>

      <div key={`${selectedGrade}-${range}`} className="rise mt-3">
        <div className="flex flex-wrap items-end gap-x-2.5 gap-y-1">
          {activeValue == null ? (
            <span className="tnum text-display leading-none text-foreground">—</span>
          ) : (
            <HeroNumber
              value={activeValue}
              format={(value) => formatDisplayValue(value, currency)}
              live={activeIndex != null}
              className="leading-none text-foreground"
            />
          )}
          {datum.hasData && datum.value.isEst && (
            <EstMark lang={lang} className="pb-1.5" />
          )}
          {shownDelta != null && (
            <span className="inline-flex items-baseline gap-x-1.5 pb-1">
              <Delta pct={shownDelta} lang={lang} />
              <span className="text-meta">{shownDate ?? windowLabel}</span>
            </span>
          )}
        </div>
      </div>

      {provenanceParts.length > 0 && (
        <p className="text-meta mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
          {provenanceParts.map((node, index) => (
            <Fragment key={index}>
              {index > 0 && <span className="text-muted-foreground">·</span>}
              {node}
            </Fragment>
          ))}
        </p>
      )}

      {hydrated &&
        priceLow != null &&
        priceHigh != null &&
        priceHigh > priceLow && (
          <>
            <span className="sr-only">
              {t(lang, "low")} {compactDisplayValue(priceLow, currency)}, {t(lang, "high")} {compactDisplayValue(priceHigh, currency)}
            </span>
            <div className="mt-3 flex max-w-sm items-center gap-2" aria-hidden>
              <span className="text-meta tnum shrink-0 text-muted-foreground">
                {t(lang, "low")} {compactDisplayValue(priceLow, currency)}
              </span>
              <div className="relative h-1.5 flex-1 rounded-full bg-foreground/10">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-foreground/30"
                  style={{ width: `${pricePos}%` }}
                />
                <span
                  className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-foreground"
                  style={{ left: `${pricePos}%` }}
                />
              </div>
              <span className="text-meta tnum inline-flex shrink-0 items-center gap-1 text-muted-foreground">
                {t(lang, "high")} {compactDisplayValue(priceHigh, currency)}
                {datum.value.isEst && <EstMark lang={lang} />}
              </span>
            </div>
          </>
        )}
    </>
  )
}

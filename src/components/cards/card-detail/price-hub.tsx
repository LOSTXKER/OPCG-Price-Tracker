"use client"

import { Fragment, useMemo, useState } from "react"
import { ChevronDown, Shield } from "lucide-react"

import { t, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"

import { GRADE_TIERS, type GradeDatum, type GradeKey } from "./grades"
import { GradeValue, Amount, Delta } from "./grade-value"
import { MiniAreaChart } from "./mini-chart"
import { mockSeries } from "./mock"
import { EditionToggle, type Edition } from "./edition-toggle"

const RANGES = ["1M", "3M", "1Y", "All"] as const

/** Less-common grades, collapsed behind a "more grades" toggle so the rail
 *  shows the popular ones (Raw A · PSA 10/9/8) by default instead of all 7. */
const SECONDARY_GRADES = new Set<GradeKey>(["raw_b", "raw_c", "bgs_95"])

/**
 * Right column — the trading panel (VISION §5.1/§5.2). Reads top-to-bottom like
 * a trading app: price + 30d move → instrument selector (edition + grade) →
 * Bid/Ask/Last ladder → Buy/Sell → tracking actions → chart. Buy/Sell are a
 * preview until the in-app marketplace lands; tracking actions work today.
 */
export function CardPriceHub({
  card,
  gradeData,
  selectedGrade,
  onSelectGrade,
  edition,
  onEditionChange,
  enAvailable = false,
  lang,
}: {
  card: { cardCode: string }
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
  const up = (datum.delta30d?.pct ?? 0) >= 0
  const nativeValue = datum.value.jpy ?? datum.value.usd ?? null

  const [range, setRange] = useState<(typeof RANGES)[number]>("3M")
  const [scrub, setScrub] = useState<number | null>(null)
  const [showAllGrades, setShowAllGrades] = useState(false)
  const series = useMemo(() => mockSeries(nativeValue, up, range), [nativeValue, up, range])
  const hi = series.length ? Math.max(...series) : null
  const lo = series.length ? Math.min(...series) : null
  const avg = series.length ? Math.round(series.reduce((a, b) => a + b, 0) / series.length) : null
  const asNative = (n: number | null) => ({
    jpy: datum.currency === "JPY" ? n : null,
    usd: datum.currency === "USD" ? n : null,
  })
  const scrubVal = scrub != null ? series[scrub] ?? null : null

  const visibleTiers = GRADE_TIERS.filter(
    (gt) => !SECONDARY_GRADES.has(gt.key) || showAllGrades || gt.key === selectedGrade,
  )

  return (
    <div className="lg:pt-1">
      {/* hero — price + 30d move */}
      <section className="text-center lg:text-left">
        <p className="text-eyebrow">
          {tier.label} · {edition} · {t(lang, "marketPrice")}
        </p>
        <div key={selectedGrade} className="rise mt-1 flex items-end justify-center gap-3 lg:justify-start">
          {scrubVal != null ? (
            <Amount {...asNative(scrubVal)} size="hero" className="text-foreground" />
          ) : (
            <GradeValue datum={datum} size="hero" className="text-foreground" />
          )}
        </div>
        {datum.delta30d && (
          <div className="mt-2 flex items-center justify-center lg:justify-start">
            <Delta pct={datum.delta30d.pct} lang={lang} size="lg" />
            <span className="ml-1.5 text-sm text-muted-foreground">{t(lang, "days30")}</span>
          </div>
        )}
      </section>

      {/* instrument selector — edition + grade on one row ("what am I trading") */}
      <section className="mt-4 flex items-center gap-2">
        <EditionToggle value={edition} onChange={onEditionChange} enAvailable={enAvailable} />
        <div className="no-sb flex flex-1 items-stretch gap-2 overflow-x-auto pb-1" role="group" aria-label={t(lang, "chooseGrade")}>
          {visibleTiers.map((gt, i) => {
            const prev = visibleTiers[i - 1]
            const groupBreak = prev && prev.family === "raw" && gt.family !== "raw"
            const d = gradeData[gt.key]
            const active = gt.key === selectedGrade
            const disabled = !d.hasData && !active
            return (
              <Fragment key={gt.key}>
                {groupBreak && <span aria-hidden className="my-1 w-px shrink-0 self-stretch bg-[var(--p-hair)]" />}
                <button
                  type="button"
                  aria-pressed={active}
                  disabled={disabled}
                  onClick={() => onSelectGrade(gt.key)}
                  className={cn(
                    "ease-chrome inline-flex shrink-0 items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
                    active ? "" : "surface-1 hairline text-muted-foreground hover:text-foreground",
                    disabled && "cursor-not-allowed opacity-40",
                  )}
                  style={active ? { background: "var(--p-honey-soft)", color: "var(--primary)", boxShadow: "inset 0 0 0 1px var(--primary)" } : undefined}
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
            className="ease-chrome surface-1 hairline flex shrink-0 items-center gap-1 self-stretch rounded-xl px-3 text-xs font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
          >
            {t(lang, "moreGrades")}
            <ChevronDown className={cn("ease-chrome size-3.5 transition-transform", showAllGrades && "rotate-180")} aria-hidden />
          </button>
        </div>
      </section>

      {/* Buy / Sell — preview until the marketplace lands (VISION §5.2). The
          buttons carry the ask, with last-sale + volume as one muted caption,
          so no separate ladder block is needed. */}
      <section className="mt-4">
        <div className="flex gap-2">
          <button
            type="button"
            title={t(lang, "comingSoon")}
            className="ease-chrome flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            {t(lang, "buyNow")}
            <Amount jpy={datum.lowestAsk.jpy} usd={datum.lowestAsk.usd} size="sm" />
          </button>
          <button
            type="button"
            title={t(lang, "comingSoon")}
            className="ease-chrome inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t(lang, "sell")}
          </button>
        </div>
        <p className="text-meta mt-1.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 lg:justify-start">
          <span className="inline-flex items-center gap-1">
            {t(lang, "lastSold")}
            <Amount jpy={datum.lastSale.jpy} usd={datum.lastSale.usd} size="xs" className="text-foreground/70" />
          </span>
          {datum.sales30d != null && (
            <span>· {datum.sales30d.toLocaleString()} {t(lang, "sales30d")}</span>
          )}
          <span>· {t(lang, "comingSoon")}</span>
        </p>
      </section>

      {/* chart */}
      <section className="mt-5">
        <div className="rounded-2xl surface-1 hairline p-4">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">{tier.label} · {card.cardCode}</span>
            <div className="surface-2 hairline inline-flex rounded-full p-0.5">
              {RANGES.map((rg) => (
                <button
                  key={rg}
                  type="button"
                  aria-pressed={rg === range}
                  onClick={() => setRange(rg)}
                  className={cn(
                    "ease-chrome rounded-full px-3 py-1 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                    rg === range ? "surface-2 text-foreground ring-1 ring-[var(--p-hair)]" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {rg}
                </button>
              ))}
            </div>
          </div>
          <MiniAreaChart data={series} height={240} up={up} onScrub={setScrub} onScrubEnd={() => setScrub(null)} />
          <div
            className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t pt-2"
            style={{ borderColor: "var(--p-hair)" }}
          >
            {[
              { l: t(lang, "high"), v: hi },
              { l: t(lang, "avg"), v: avg },
              { l: t(lang, "low"), v: lo },
            ].map((s) => (
              <span key={s.l} className="text-meta inline-flex items-center gap-1">
                {s.l}
                <Amount {...asNative(s.v)} size="xs" className="text-foreground/70" />
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

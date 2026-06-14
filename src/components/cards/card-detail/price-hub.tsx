"use client"

import { Fragment, useMemo, useState, type ReactNode } from "react"
import { ChevronDown, Shield } from "lucide-react"

import { t, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"

import { GRADE_TIERS, type GradeDatum, type GradeKey } from "./grades"
import { GradeValue, Amount, Delta } from "./grade-value"
import { MiniAreaChart } from "./mini-chart"
import { mockSeries } from "./mock"

const RANGES = ["1M", "3M", "1Y", "All"] as const

/** Less-common grades, collapsed behind a "more grades" toggle so the rail
 *  shows the popular ones (Raw A · PSA 10/9/8) by default instead of all 7. */
const SECONDARY_GRADES = new Set<GradeKey>(["raw_b", "raw_c", "bgs_95"])

/**
 * Right column — price + chart. Ported from the proto visionary card-detail and
 * fed with real grade data (Raw A = Yuyutei, PSA 10 = SNKRDUNK; other grades
 * modeled), currency-aware. `cta` renders the primary actions right after the
 * grade rail so the price and its call-to-action stay together on every screen.
 */
export function CardPriceHub({
  card,
  gradeData,
  selectedGrade,
  onSelectGrade,
  cta,
  lang,
}: {
  card: { cardCode: string }
  gradeData: Record<GradeKey, GradeDatum>
  selectedGrade: GradeKey
  onSelectGrade: (key: GradeKey) => void
  cta?: ReactNode
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

  // Rail: popular grades always; secondary grades only when expanded (or when the
  // selected grade is itself a secondary one, so the active chip is never hidden).
  const visibleTiers = GRADE_TIERS.filter(
    (gt) => !SECONDARY_GRADES.has(gt.key) || showAllGrades || gt.key === selectedGrade,
  )

  return (
    <div className="lg:pt-1">
      {/* hero */}
      <section className="text-center lg:text-left">
        <p className="text-eyebrow">
          {tier.label} · {t(lang, "marketPrice")}
        </p>
        <div key={selectedGrade} className="rise mt-1 flex items-end justify-center gap-3 lg:justify-start">
          {scrubVal != null ? (
            <Amount {...asNative(scrubVal)} size="hero" className="text-foreground" />
          ) : (
            <GradeValue datum={datum} size="hero" className="text-foreground" />
          )}
        </div>

        {/* stat row — Last Sale (settled) · 30d trend · volume. One stat block,
            none of which repeats the hero number. */}
        <div className="mt-4 grid grid-cols-3 rounded-2xl surface-1 hairline py-3">
          <div className="px-2">
            <p className="text-eyebrow">{t(lang, "lastSold")}</p>
            <Amount jpy={datum.lastSale.jpy} usd={datum.lastSale.usd} size="stat" className="mt-0.5 block text-foreground" />
          </div>
          <div className="px-2" style={{ borderLeft: "1px solid var(--p-hair)" }}>
            <p className="text-eyebrow">{t(lang, "days30")}</p>
            {datum.delta30d ? (
              <Delta pct={datum.delta30d.pct} lang={lang} size="md" className="mt-0.5" />
            ) : (
              <span className="tnum mt-0.5 block text-sm text-muted-foreground/40">—</span>
            )}
          </div>
          <div className="px-2" style={{ borderLeft: "1px solid var(--p-hair)" }}>
            <p className="text-eyebrow">{t(lang, "sales30d")}</p>
            <p className="tnum mt-0.5 text-sm font-bold text-foreground">
              {datum.sales30d != null ? datum.sales30d.toLocaleString() : "—"}
            </p>
          </div>
        </div>
      </section>

      {/* grade chip rail — best-first, grouped Raw | Graded, popular grades shown
          with the rest behind a "more grades" toggle */}
      <section className="mt-5">
        <div className="no-sb flex items-stretch gap-2 overflow-x-auto pb-1" role="group" aria-label={t(lang, "chooseGrade")}>
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
                    "ease-chrome flex shrink-0 flex-col items-start rounded-xl px-3.5 py-2 text-left focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
                    active ? "hairline" : "surface-1 hairline",
                    disabled && "cursor-not-allowed opacity-40",
                  )}
                  style={active ? { background: "var(--p-honey-soft)", boxShadow: "inset 0 0 0 1px var(--primary)" } : undefined}
                >
                  <span className={cn("flex items-center gap-1 text-xs font-bold", active ? "text-primary" : "text-foreground")}>
                    {gt.family !== "raw" && <Shield className="size-3" aria-hidden />}
                    {gt.short}
                  </span>
                  <GradeValue datum={d} size="xs" className="mt-0.5 text-muted-foreground" />
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

      {/* primary actions — kept adjacent to the price so the CTA is reachable
          on short laptop screens without pinning anything */}
      {cta && <div className="mt-4">{cta}</div>}

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
          <MiniAreaChart data={series} up={up} onScrub={setScrub} onScrubEnd={() => setScrub(null)} />
          {/* hi/avg/lo as one muted caption — supporting context, not a second
              stat block competing with the hero */}
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

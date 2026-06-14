"use client"

import { useMemo, useState } from "react"
import { Shield } from "lucide-react"

import { t, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"

import { GRADE_TIERS, type GradeDatum, type GradeKey } from "./grades"
import { GradeValue, Amount, Delta } from "./grade-value"
import { MiniAreaChart } from "./mini-chart"
import { mockSeries } from "./mock"

const RANGES = ["1M", "3M", "1Y", "All"] as const

/**
 * Right column — price + chart. Ported verbatim from the proto visionary
 * card-detail (src/app/proto/card-detail/page.tsx) and fed with real grade data
 * (Raw A = Yuyutei, PSA 10 = SNKRDUNK; other grades modeled), currency-aware.
 */
export function CardPriceHub({
  card,
  gradeData,
  selectedGrade,
  onSelectGrade,
  lang,
}: {
  card: { cardCode: string }
  gradeData: Record<GradeKey, GradeDatum>
  selectedGrade: GradeKey
  onSelectGrade: (key: GradeKey) => void
  lang: Language
}) {
  const datum = gradeData[selectedGrade]
  const tier = datum.tier
  const up = (datum.delta30d?.pct ?? 0) >= 0
  const nativeValue = datum.value.jpy ?? datum.value.usd ?? null

  const [range, setRange] = useState<(typeof RANGES)[number]>("3M")
  const [scrub, setScrub] = useState<number | null>(null)
  const series = useMemo(() => mockSeries(nativeValue, up, range), [nativeValue, up, range])
  const hi = series.length ? Math.max(...series) : null
  const lo = series.length ? Math.min(...series) : null
  const avg = series.length ? Math.round(series.reduce((a, b) => a + b, 0) / series.length) : null
  const asNative = (n: number | null) => ({
    jpy: datum.currency === "JPY" ? n : null,
    usd: datum.currency === "USD" ? n : null,
  })
  const scrubVal = scrub != null ? series[scrub] ?? null : null

  return (
    <div className="lg:pt-1">
      {/* hero */}
      <section className="text-center lg:text-left">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {tier.label} · {t(lang, "marketPrice")}
        </p>
        <div key={selectedGrade} className="rise mt-1 flex items-end justify-center gap-3 lg:justify-start">
          {scrubVal != null ? (
            <Amount {...asNative(scrubVal)} size="hero" className="text-foreground" />
          ) : (
            <GradeValue datum={datum} size="hero" className="text-foreground" />
          )}
        </div>
        <div className="mt-2 flex items-center justify-center lg:justify-start">
          {datum.delta30d && (
            <>
              <Delta pct={datum.delta30d.pct} lang={lang} size="lg" />
              <span className="ml-1.5 text-sm text-muted-foreground">{t(lang, "days30")}</span>
            </>
          )}
        </div>

        {/* 3-stat */}
        <div className="mt-4 grid grid-cols-3 rounded-2xl surface-1 hairline py-3">
          <div className="px-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t(lang, "lastSold")}</p>
            <Amount jpy={datum.lastSale.jpy} usd={datum.lastSale.usd} size="stat" className="mt-0.5 block text-foreground" />
          </div>
          <div className="px-2" style={{ borderLeft: "1px solid var(--p-hair)" }}>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t(lang, "lowestListing")}</p>
            <Amount jpy={datum.lowestAsk.jpy} usd={datum.lowestAsk.usd} size="stat" className="mt-0.5 block text-foreground" />
          </div>
          <div className="px-2" style={{ borderLeft: "1px solid var(--p-hair)" }}>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t(lang, "sales30d")}</p>
            <p className="tnum mt-0.5 text-sm font-bold text-foreground">
              {datum.sales30d != null ? datum.sales30d.toLocaleString() : "—"}
            </p>
          </div>
        </div>
      </section>

      {/* grade chip rail */}
      <section className="mt-5">
        <div className="no-sb flex gap-2 overflow-x-auto pb-1" role="group" aria-label={t(lang, "chooseGrade")}>
          {GRADE_TIERS.map((gt) => {
            const d = gradeData[gt.key]
            const active = gt.key === selectedGrade
            const disabled = !d.hasData && !active
            return (
              <button
                key={gt.key}
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
            )
          })}
        </div>
      </section>

      {/* chart */}
      <section className="mt-3">
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
                    rg === range ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {rg}
                </button>
              ))}
            </div>
          </div>
          <MiniAreaChart data={series} up={up} onScrub={setScrub} onScrubEnd={() => setScrub(null)} />
          <div className="mt-2 grid grid-cols-3 gap-2 border-t pt-3 text-center" style={{ borderColor: "var(--p-hair)" }}>
            {[
              { l: t(lang, "high"), v: hi },
              { l: t(lang, "avg"), v: avg },
              { l: t(lang, "low"), v: lo },
            ].map((s) => (
              <div key={s.l}>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.l}</p>
                <Amount {...asNative(s.v)} size="stat" className="mt-0.5 block text-foreground" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

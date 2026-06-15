"use client"

import { useMemo, useState } from "react"

import { t, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"

import type { GradeDatum } from "./grades"
import { Amount } from "./grade-value"
import { MiniAreaChart } from "./mini-chart"
import { mockSeries } from "./mock"

const RANGES = ["1M", "3M", "1Y", "All"] as const

/** Price chart panel — the visual focal point of the right column. Bound to the
 *  selected grade's value; range toggles reshape the (prototype) series. */
export function CardChart({
  datum,
  cardCode,
  lang,
}: {
  datum: GradeDatum
  cardCode: string
  lang: Language
}) {
  const up = (datum.delta30d?.pct ?? 0) >= 0
  const nativeValue = datum.value.jpy ?? datum.value.usd ?? null
  const [range, setRange] = useState<(typeof RANGES)[number]>("3M")
  const series = useMemo(() => mockSeries(nativeValue, up, range), [nativeValue, up, range])
  const hi = series.length ? Math.max(...series) : null
  const lo = series.length ? Math.min(...series) : null
  const avg = series.length ? Math.round(series.reduce((a, b) => a + b, 0) / series.length) : null
  const asNative = (n: number | null) => ({
    jpy: datum.currency === "JPY" ? n : null,
    usd: datum.currency === "USD" ? n : null,
  })

  return (
    <div className="rounded-2xl surface-1 hairline p-4">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">{datum.tier.label} · {cardCode}</span>
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
      <MiniAreaChart data={series} height={360} up={up} />
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
  )
}

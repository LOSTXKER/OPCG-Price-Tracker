"use client"

import { jpyToDisplayValue, usdToDisplayValue, formatPct, type Currency } from "@/lib/utils/currency"
import { useUIStore } from "@/stores/ui-store"
import { t, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import type { GradeDatum, Stat } from "./grades"

/** Symbol-PREFIX price (฿48,000 / ¥1,280,000 / $268) — matches the proto. */
const SYMBOL: Record<Currency, string> = { THB: "฿", JPY: "¥", USD: "$" }

const SIZE = {
  xs: "text-xs",
  stat: "text-sm font-bold",
  sm: "text-sm font-medium",
  md: "text-lg font-semibold",
  hero: "text-display",
} as const

/** A bare native-currency amount (JPY or USD) in the active display currency. */
export function Amount({
  jpy,
  usd,
  size = "sm",
  className,
}: {
  jpy?: number | null
  usd?: number | null
  size?: keyof typeof SIZE
  className?: string
}) {
  const currency = useUIStore((s) => s.currency)
  let v: number | null = null
  if (usd != null) v = usdToDisplayValue(usd, currency)
  else if (jpy != null) v = jpyToDisplayValue(jpy, currency)
  const text = v == null ? "—" : SYMBOL[currency] + Math.round(v).toLocaleString("en-US")
  return (
    <span className={cn("tnum", SIZE[size], v == null && "text-muted-foreground/40", className)}>
      {text}
    </span>
  )
}

/** Small "est" marker — honesty flag on any modeled value. Discoverable via
 *  title + aria-label (not hover-only). */
export function EstMark({ lang, className }: { lang: Language; className?: string }) {
  const note = t(lang, "estimateNote")
  return (
    <span
      title={note}
      aria-label={note}
      className={cn("text-overlay shrink-0 cursor-help uppercase text-muted-foreground/50", className)}
    >
      est
    </span>
  )
}

/** A grade's headline value (datum.value) in native currency; '—' when no data. */
export function GradeValue({
  datum,
  size = "sm",
  className,
}: {
  datum: GradeDatum
  size?: keyof typeof SIZE
  className?: string
}) {
  const s = datum.value
  if (!datum.hasData || (s.jpy == null && s.usd == null)) {
    return <span className={cn("tnum text-muted-foreground/40", SIZE[size], className)}>—</span>
  }
  return <Amount jpy={s.jpy} usd={s.usd} size={size} className={className} />
}

/** A Stat amount (clean). */
export function StatValue({
  stat,
  size = "md",
  className,
}: {
  stat: Stat
  size?: keyof typeof SIZE
  className?: string
}) {
  return <Amount jpy={stat.jpy} usd={stat.usd} size={size} className={className} />
}

/** Signed % delta with a ▲/▼ glyph — arrow carries meaning, color reinforces (a11y).
 *  Rounds-to-0.0% renders neutral (no arrow, muted) — never a false up/down. */
export function Delta({
  pct,
  lang,
  size = "md",
  className,
  abs,
  absFirst,
}: {
  pct: number
  lang: Language
  size?: "md" | "lg"
  className?: string
  /** Pre-formatted absolute change string (display currency) shown beside the %. */
  abs?: string
  /** Render the absolute change BEFORE the % (e.g. "+380,242 ฿ · 350.1%") — Robinhood
   *  order, used in the price hero. Default keeps "% · +abs". */
  absFirst?: boolean
}) {
  const flat = Math.abs(pct) < 0.05
  const up = pct > 0
  const color = flat ? "var(--muted-foreground)" : up ? "var(--price-up)" : "var(--price-down)"
  return (
    <span
      className={cn(
        "tnum inline-flex items-center gap-0.5 font-semibold",
        // delta stays subordinate to the hero number — even the "lg" variant sits
        // at text-sm so a 3-digit % never rivals the .text-display price.
        size === "lg" ? "text-sm" : "text-sm",
        className,
      )}
      style={{ color }}
    >
      {!flat && <span aria-hidden>{up ? "▲" : "▼"}</span>}
      <span className="sr-only">{flat ? "" : up ? t(lang, "deltaUp") : t(lang, "deltaDown")}</span>
      {absFirst && abs && !flat ? (
        <>
          <span className="font-medium">{up ? "+" : "−"}{abs}</span>
          <span className="opacity-60"> · </span>
          {formatPct(Math.abs(pct))}%
        </>
      ) : (
        <>
          {formatPct(Math.abs(pct))}%
          {abs && !flat && <span className="font-medium opacity-75"> · {up ? "+" : "−"}{abs}</span>}
        </>
      )}
    </span>
  )
}

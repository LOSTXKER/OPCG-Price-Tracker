"use client"

import { formatPct } from "@/lib/utils/currency"
import { t, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"

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

/** Signed % delta — the +/− sign carries direction, color reinforces (a11y).
 *  Rounds-to-0.0% renders neutral (muted, no sign) — never a false up/down. */
export function Delta({
  pct,
  lang,
  className,
  abs,
  absFirst,
}: {
  pct: number
  lang: Language
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
        "tnum inline-flex items-center gap-0.5 font-semibold text-sm",
        className,
      )}
      style={{ color }}
    >
      <span className="sr-only">{flat ? "" : up ? t(lang, "deltaUp") : t(lang, "deltaDown")}</span>
      {absFirst && abs && !flat ? (
        <>
          <span className="font-medium">{up ? "+" : "−"}{abs}</span>
          <span className="opacity-60"> · </span>
          {formatPct(Math.abs(pct))}%
        </>
      ) : (
        <>
          {!flat && (up ? "+" : "−")}{formatPct(Math.abs(pct))}%
          {abs && !flat && <span className="font-medium opacity-75"> · {up ? "+" : "−"}{abs}</span>}
        </>
      )}
    </span>
  )
}

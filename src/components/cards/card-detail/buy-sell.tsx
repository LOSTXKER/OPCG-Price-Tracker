"use client"

import { t, type Language } from "@/lib/i18n"
import { Amount } from "./grade-value"
import type { GradeDatum } from "./grades"

/**
 * Buy / Sell trade buttons + a market-context caption (last sale · 30d volume).
 * A preview until the in-app marketplace lands (VISION §5.2). Buy keeps the page's
 * single gold accent; the selected grade drives the figures via `datum`.
 */
export function CardBuySell({
  datum,
  lang,
  className,
}: {
  datum: GradeDatum
  lang: Language
  className?: string
}) {
  return (
    <div className={className}>
      <div className="flex gap-2">
        <button
          type="button"
          title={t(lang, "comingSoon")}
          className="ease-chrome flex h-11 flex-1 items-center justify-center rounded-xl text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
        >
          {t(lang, "buyNow")}
        </button>
        <button
          type="button"
          title={t(lang, "comingSoon")}
          className="ease-chrome inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t(lang, "sell")}
        </button>
      </div>
      <p className="text-meta mt-1.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5">
        <span className="inline-flex items-center gap-1">
          {t(lang, "lastSold")}
          <Amount jpy={datum.lastSale.jpy} usd={datum.lastSale.usd} size="xs" className="text-foreground/70" />
        </span>
        {datum.sales30d != null && (
          <span>· {datum.sales30d.toLocaleString()} {t(lang, "sales30d")}</span>
        )}
        <span>· {t(lang, "comingSoon")}</span>
      </p>
    </div>
  )
}

"use client"

import { t, type Language } from "@/lib/i18n"

/**
 * Buy / Sell trade buttons — a preview until the in-app marketplace lands
 * (VISION §5.2). Buy keeps the page's single gold accent.
 */
export function CardBuySell({ lang, className }: { lang: Language; className?: string }) {
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
    </div>
  )
}

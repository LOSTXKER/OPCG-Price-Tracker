import { t, type Language } from "@/lib/i18n"

import type { GradeDatum } from "./grades"
import { Amount } from "./grade-value"

/**
 * Compact trade snapshot for the SELECTED grade, sat beside the Buy button in
 * the left rail — the figures a buyer wants before they act (StockX/Cardmarket):
 * last settled sale, lowest current listing, and 30-day volume.
 */
export function CardGradeSummary({ datum, lang }: { datum: GradeDatum; lang: Language }) {
  const cell = (label: string, body: React.ReactNode, divider: boolean) => (
    <div className="px-3 py-2.5" style={divider ? { borderLeft: "1px solid var(--p-hair)" } : undefined}>
      <p className="text-eyebrow">{label}</p>
      <div className="mt-0.5">{body}</div>
    </div>
  )

  return (
    <div className="grid grid-cols-3 rounded-2xl surface-1 hairline">
      {cell(t(lang, "lastSold"), <Amount jpy={datum.lastSale.jpy} usd={datum.lastSale.usd} size="stat" className="text-foreground" />, false)}
      {cell(t(lang, "lowestListing"), <Amount jpy={datum.lowestAsk.jpy} usd={datum.lowestAsk.usd} size="stat" className="text-foreground" />, true)}
      {cell(
        t(lang, "sales30d"),
        <span className="tnum text-sm font-bold text-foreground">{datum.sales30d != null ? datum.sales30d.toLocaleString() : "—"}</span>,
        true,
      )}
    </div>
  )
}

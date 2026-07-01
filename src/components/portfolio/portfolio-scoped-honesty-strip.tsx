"use client"

import { ArrowDown, ArrowUp } from "lucide-react"

import { MASKED } from "@/lib/constants/ui"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { formatDisplayValue, jpyToDisplayValue, formatPct } from "@/lib/utils/currency"
import { useUIStore } from "@/stores/ui-store"

/**
 * Shown in place of the value chart when the portfolio is scoped to a single
 * game. Per-game history snapshots don't exist yet, so rather than draw a faked
 * (whole-portfolio) curve under a scoped hero, we give an honest Cost-vs-Market
 * + P/L readout from the scoped holdings, plus a note that the graph is
 * all-games only. Replaced by a real per-game chart once snapshots are per-game
 * (VISION §6, schema-gated).
 */
export function PortfolioScopedHonestyStrip({
  marketValueJpy,
  costJpy,
  hasPnl,
  hideBalance = false,
}: {
  marketValueJpy: number
  costJpy: number
  hasPnl: boolean
  hideBalance?: boolean
}) {
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)
  const money = (jpy: number) =>
    hideBalance ? MASKED : formatDisplayValue(jpyToDisplayValue(jpy, currency), currency)

  const pnl = marketValueJpy - costJpy
  const pnlPct = costJpy > 0 ? (pnl / costJpy) * 100 : 0
  const up = pnl >= 0

  return (
    <div className="rounded-xl border border-[var(--p-hair)] p-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-eyebrow">{t(lang, "marketValue")}</p>
          <p className="mt-0.5 font-price text-lg font-bold tabular-nums">{money(marketValueJpy)}</p>
        </div>
        <div>
          <p className="text-eyebrow">{t(lang, "costBasis")}</p>
          <p className="mt-0.5 font-price text-lg tabular-nums text-muted-foreground">{money(costJpy)}</p>
        </div>
      </div>

      {hasPnl && !hideBalance && (
        <div className="mt-3 flex items-center gap-2 border-t border-[var(--p-hair)] pt-3">
          <span className="text-eyebrow">{t(lang, "pnl")}</span>
          <span
            className={cn(
              "inline-flex items-center gap-1 font-price text-sm font-semibold tabular-nums",
              up ? "text-price-up" : "text-price-down",
            )}
          >
            {up ? <ArrowUp className="size-3.5" aria-hidden /> : <ArrowDown className="size-3.5" aria-hidden />}
            {up ? "+" : "-"}
            {money(Math.abs(pnl))}
            <span className="opacity-70">({formatPct(Math.abs(pnlPct))}%)</span>
          </span>
        </div>
      )}

      <p className="mt-3 text-meta text-muted-foreground/70">{t(lang, "chartAllGamesOnly")}</p>
    </div>
  )
}

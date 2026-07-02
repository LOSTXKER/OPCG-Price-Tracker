"use client"

import { ArrowDown, ArrowUp } from "lucide-react"

import { HeroNumber } from "@/components/ui/hero-number"
import { MASKED } from "@/lib/constants/ui"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/stores/ui-store"
import { t } from "@/lib/i18n"
import {
  jpyToDisplayValue,
  formatDisplayValue,
  formatPct,
} from "@/lib/utils/currency"

export interface PortfolioHeroProps {
  valueJpy: number
  deltaJpy: number
  deltaPct: number
  hasPnl: boolean
  live?: boolean
  hideBalance?: boolean
  /** When a single game is filtered, the game's short name — appended to the
   *  eyebrow so the scoped total never reads as the whole-portfolio value. */
  scopeLabel?: string | null
  /** Thin per-game tint for the scoped hero glow (null in the all-games view). */
  scopeTint?: string | null
}

/**
 * Page hero: one big number (VISION §4 rule 1) + an optional P/L delta pill.
 *
 * This component is scrub-bound: the parent passes the scrubbed chart point's
 * value as `valueJpy` and `live=true` while the user drags, then `live=false`
 * on release. Scrub state is NOT managed here — just reflected from props.
 */
export function PortfolioHero({
  valueJpy,
  deltaJpy,
  deltaPct,
  hasPnl,
  live = false,
  hideBalance = false,
  scopeLabel = null,
  scopeTint = null,
}: PortfolioHeroProps) {
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)

  const isUp = deltaJpy >= 0
  const absValueDisplay = formatDisplayValue(
    jpyToDisplayValue(Math.abs(deltaJpy), currency),
    currency,
  )
  const absPct = Math.abs(deltaPct)

  // No w-full: as a block it already fills alone, and inside a flex row (the
  // overview value strip) it must size to content so the stats sit beside it.
  return (
    <section className="relative min-w-0">
      {scopeTint && (
        <div
          aria-hidden
          className="pointer-events-none absolute -left-4 -top-6 -z-10 h-24 w-56 rounded-full blur-2xl"
          style={{ background: `color-mix(in srgb, ${scopeTint} 18%, transparent)` }}
        />
      )}
      <p className="text-eyebrow">
        {t(lang, "portfolioValue")}
        {scopeLabel ? <span className="text-primary"> · {scopeLabel}</span> : null}
      </p>

      <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-2">
        <HeroNumber
          value={jpyToDisplayValue(valueJpy, currency)}
          format={(n) => formatDisplayValue(n, currency)}
          live={live}
          hidden={hideBalance}
        />

        {/* Plain-text delta — no filled pill. The color + arrow carry the
            meaning (Robinhood restraint); a colored box is chrome we don't need. */}
        {hasPnl && (
          <span
            className={cn(
              "inline-flex items-center gap-1 font-price tabular-nums",
              "text-body-sm font-medium",
              isUp ? "text-price-up" : "text-price-down",
            )}
          >
            {isUp ? (
              <ArrowUp className="size-3.5 shrink-0" aria-hidden />
            ) : (
              <ArrowDown className="size-3.5 shrink-0" aria-hidden />
            )}

            {hideBalance ? (
              <span aria-label="balance hidden">{MASKED}</span>
            ) : (
              <>
                <span>
                  {isUp ? "+" : "-"}
                  {absValueDisplay}
                </span>
                <span className="opacity-70">
                  ({formatPct(absPct, 2)}%)
                </span>
              </>
            )}
          </span>
        )}
      </div>
    </section>
  )
}

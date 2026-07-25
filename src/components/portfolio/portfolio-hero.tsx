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
  deltaJpy: number | null
  deltaPct: number | null
  hasPnl: boolean
  valueAvailable?: boolean
  valuationComplete?: boolean
  hideBalance?: boolean
  /** Keep the analytical hero honest when cost/price coverage is incomplete. */
  showUnavailablePnl?: boolean
  /** When a single game is filtered, the game's short name — appended to the
   *  eyebrow so the scoped total never reads as the whole-portfolio value. */
  scopeLabel?: string | null
}
/**
 * Page summary value: one big number (VISION §4 rule 1) + optional P/L.
 */
export function PortfolioHero({
  valueJpy,
  deltaJpy,
  deltaPct,
  hasPnl,
  valueAvailable = true,
  valuationComplete = true,
  hideBalance = false,
  showUnavailablePnl = false,
  scopeLabel = null,
}: PortfolioHeroProps) {
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)

  const safeDeltaJpy = deltaJpy ?? 0
  const isUp = safeDeltaJpy >= 0
  const absValueDisplay = formatDisplayValue(
    jpyToDisplayValue(Math.abs(safeDeltaJpy), currency),
    currency,
  )
  const absPct = deltaPct == null ? null : Math.abs(deltaPct)

  // No w-full: as a block it already fills alone, and inside a flex row (the
  // overview value strip) it must size to content so the stats sit beside it.
  return (
    <div className="relative min-w-0">
      <p className="text-eyebrow">
        {t(lang, valuationComplete ? "portfolioValue" : "portfolioEstimatedValue")}
        {scopeLabel ? <span className="text-primary"> · {scopeLabel}</span> : null}
      </p>

      <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-2">
        <span className="inline-flex min-w-0 items-baseline gap-1">
          {valueAvailable && !valuationComplete && !hideBalance && (
            <span
              aria-label={t(lang, "portfolioValuePartial")}
              className="text-h2 text-muted-foreground"
            >
              ≈
            </span>
          )}
          {valueAvailable ? (
            <HeroNumber
              value={jpyToDisplayValue(valueJpy, currency)}
              format={(n) => formatDisplayValue(n, currency)}
              hidden={hideBalance}
              hiddenText={MASKED}
              className="font-price"
            />
          ) : (
            <span className="text-display text-muted-foreground" aria-label={t(lang, "portfolioValueUnavailable")}>
              —
            </span>
          )}
        </span>

        {/* Plain-text delta — no filled pill. The color + arrow carry the
            meaning (Robinhood restraint); a colored box is chrome we don't need. */}
        {hasPnl && deltaJpy != null && (
          <span
            className={cn(
              "inline-flex items-center gap-1 tabular-nums",
              "text-body-sm font-price font-medium",
              isUp ? "text-price-up" : "text-price-down",
            )}
          >
            {isUp ? (
              <ArrowUp className="size-3.5 shrink-0" aria-hidden />
            ) : (
              <ArrowDown className="size-3.5 shrink-0" aria-hidden />
            )}

            {hideBalance ? (
              <span aria-label={t(lang, "balanceHidden")}>{MASKED}</span>
            ) : (
              <span>
                {isUp ? "+" : "-"}
                {absValueDisplay}
              </span>
            )}
            {absPct != null && (
              <span className="opacity-70">({formatPct(absPct, 2)}%)</span>
            )}
          </span>
        )}

        {!hasPnl && showUnavailablePnl ? (
          <span className="text-meta inline-flex items-center gap-1.5 tabular-nums">
            <span>{t(lang, "unrealizedPnl")} —</span>
            <span aria-hidden>·</span>
            <span>{t(lang, "roi")} —</span>
          </span>
        ) : null}
      </div>
    </div>
  )
}

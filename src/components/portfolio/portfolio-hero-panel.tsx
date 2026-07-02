"use client"

import { ArrowDown, ArrowUp } from "lucide-react"

import { Surface } from "@/components/ui/surface"
import { MASKED } from "@/lib/constants/ui"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import {
  formatDisplayValue,
  jpyToDisplayValue,
  formatPct,
} from "@/lib/utils/currency"
import { useUIStore } from "@/stores/ui-store"
import type { PortfolioStats } from "@/lib/types/portfolio"

import { PortfolioHero } from "./portfolio-hero"

/**
 * The overview hero card: ONE panel carrying the portfolio value + delta and a
 * four-stat row (P/L · Cost · Best · Worst) — the live site's layout, rebuilt on
 * the warm token system. A thin radial glow (≤12% mix, VISION §5.3 allows ≤18%)
 * tints the corner by P/L direction — or by the game's accent when scoped.
 */
export function PortfolioHeroPanel({
  stats,
  hideBalance = false,
  scopeLabel = null,
  scopeTint = null,
}: {
  stats: PortfolioStats
  hideBalance?: boolean
  scopeLabel?: string | null
  scopeTint?: string | null
}) {
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)

  const hasCost = stats.totalCostJpy > 0
  const isUp = stats.unrealizedPnl >= 0
  const money = (jpy: number) =>
    hideBalance ? MASKED : formatDisplayValue(jpyToDisplayValue(jpy, currency), currency)

  const glow = scopeTint ?? (isUp ? "var(--price-up)" : "var(--price-down)")

  return (
    <Surface variant="panel" className="relative overflow-hidden p-5 sm:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-20 h-64 w-80 rounded-full blur-3xl"
        style={{ background: `color-mix(in srgb, ${glow} 12%, transparent)` }}
      />

      <PortfolioHero
        valueJpy={stats.totalValueJpy}
        deltaJpy={stats.unrealizedPnl}
        deltaPct={stats.unrealizedPnlPercent}
        hasPnl={hasCost}
        hideBalance={hideBalance}
        scopeLabel={scopeLabel}
      />

      {/* Stat row — P/L · Cost Basis · Best · Worst (no market-value repeat) */}
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-[var(--p-hair)] pt-4 sm:grid-cols-4">
        <div>
          <p className="text-eyebrow">{t(lang, "pnl")}</p>
          <p className="mt-1">
            {hasCost ? (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-price",
                  hideBalance ? "text-foreground" : isUp ? "text-price-up" : "text-price-down",
                )}
              >
                {!hideBalance &&
                  (isUp ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
                {hideBalance
                  ? MASKED
                  : `${isUp ? "+" : "−"}${money(Math.abs(stats.unrealizedPnl))}`}
              </span>
            ) : (
              <span className="text-price text-muted-foreground">—</span>
            )}
          </p>
        </div>

        <div>
          <p className="text-eyebrow">{t(lang, "costBasis")}</p>
          <p className="mt-1 text-price text-foreground/80">{money(stats.totalCostJpy)}</p>
        </div>

        <PerformerStat
          label={t(lang, "bestPerformer")}
          performer={stats.bestPerformer}
          hideBalance={hideBalance}
        />
        <PerformerStat
          label={t(lang, "worstPerformer")}
          performer={stats.worstPerformer}
          hideBalance={hideBalance}
        />
      </div>
    </Surface>
  )
}

function PerformerStat({
  label,
  performer,
  hideBalance,
}: {
  label: string
  performer: { name: string; pnl: number; pnlPercent: number } | null
  hideBalance: boolean
}) {
  const up = (performer?.pnl ?? 0) >= 0
  return (
    <div className="min-w-0">
      <p className="text-eyebrow">{label}</p>
      {performer ? (
        <p className="mt-1 flex items-baseline gap-1.5">
          <span className="truncate text-sm font-medium">{performer.name}</span>
          {!hideBalance && (
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-0.5 font-price text-micro tabular-nums",
                up ? "text-price-up" : "text-price-down",
              )}
            >
              {up ? <ArrowUp className="size-2.5" /> : <ArrowDown className="size-2.5" />}
              {formatPct(Math.abs(performer.pnlPercent), 1)}%
            </span>
          )}
        </p>
      ) : (
        <p className="mt-1 text-price text-muted-foreground">—</p>
      )}
    </div>
  )
}

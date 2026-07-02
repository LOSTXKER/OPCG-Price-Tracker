"use client"

import { ArrowDown, ArrowUp } from "lucide-react"

import { Surface } from "@/components/ui/surface"
import { cn } from "@/lib/utils"
import { t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import {
  formatDisplayValue,
  jpyToDisplayValue,
  formatPct,
} from "@/lib/utils/currency"
import type { PortfolioStats } from "@/lib/types/portfolio"

/**
 * Two stats only: Cost Basis · P/L (with ROI% inline). Market value is NOT
 * repeated here — the hero already owns that number, and ROI is just the P/L
 * as a percent, so folding it in kills two redundant boxes (owner feedback:
 * "ด้านขวาซ้ำซ้อน").
 */
export function PortfolioKpi({
  stats,
  hideBalance = false,
}: {
  stats: PortfolioStats
  hideBalance?: boolean
}) {
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)

  const hasCost = stats.totalCostJpy > 0
  const pnl = stats.unrealizedPnl
  const isUp = pnl >= 0

  function fmtMoney(jpy: number): string {
    return formatDisplayValue(jpyToDisplayValue(jpy, currency), currency)
  }

  return (
    <Surface variant="panel" className="grid grid-cols-2 overflow-hidden">
      <div className="p-4">
        <p className="text-eyebrow">{t(lang, "costBasis")}</p>
        <p className="mt-1.5 text-price text-foreground/80">
          {hideBalance ? "••••" : fmtMoney(stats.totalCostJpy)}
        </p>
      </div>

      <div className="border-l border-[var(--p-hair)] p-4">
        <p className="text-eyebrow">{t(lang, "pnl")}</p>
        <p className="mt-1.5">
          {hasCost ? (
            <span
              className={cn(
                "inline-flex flex-wrap items-baseline gap-x-1.5 text-price",
                hideBalance
                  ? "text-foreground"
                  : isUp
                    ? "text-price-up"
                    : "text-price-down",
              )}
            >
              <span className="inline-flex items-center gap-0.5">
                {!hideBalance &&
                  (isUp ? (
                    <ArrowUp className="size-3" />
                  ) : (
                    <ArrowDown className="size-3" />
                  ))}
                {hideBalance
                  ? "••••"
                  : `${isUp ? "+" : "−"}${fmtMoney(Math.abs(pnl))}`}
              </span>
              {!hideBalance && (
                <span className="text-micro opacity-70">
                  ({isUp ? "+" : "−"}
                  {formatPct(Math.abs(stats.unrealizedPnlPercent), 1)}%)
                </span>
              )}
            </span>
          ) : (
            <span className="text-price text-muted-foreground">—</span>
          )}
        </p>
      </div>
    </Surface>
  )
}

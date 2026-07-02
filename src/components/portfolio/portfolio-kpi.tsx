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

export function PortfolioKpi({
  stats,
  hideBalance = false,
  compact = false,
}: {
  stats: PortfolioStats
  hideBalance?: boolean
  /** Force the 2×2 layout at every breakpoint — for narrow context rails. */
  compact?: boolean
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
    <Surface
      variant="panel"
      className={cn("grid grid-cols-2 overflow-hidden", !compact && "sm:grid-cols-4")}
    >
      {/* 1 — Market Value */}
      <div className="p-4">
        <p className="text-eyebrow">{t(lang, "marketValue")}</p>
        <p className="mt-1.5 text-price">
          {hideBalance ? "••••" : fmtMoney(stats.totalValueJpy)}
        </p>
      </div>

      {/* 2 — Cost Basis */}
      <div className="border-l border-[var(--p-hair)] p-4 sm:p-4">
        <p className="text-eyebrow">{t(lang, "costBasis")}</p>
        <p className="mt-1.5 text-price text-foreground/80">
          {hideBalance ? "••••" : fmtMoney(stats.totalCostJpy)}
        </p>
      </div>

      {/* 3 — P/L (top hairline on 2-col → left hairline on sm+) */}
      <div
        className={cn(
          "border-t border-[var(--p-hair)] p-4",
          !compact && "sm:border-t-0 sm:border-l sm:p-4",
        )}
      >
        <p className="text-eyebrow">{t(lang, "pnl")}</p>
        <p className="mt-1.5">
          {hasCost ? (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-price",
                hideBalance
                  ? "text-foreground"
                  : isUp
                    ? "text-price-up"
                    : "text-price-down",
              )}
            >
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
          ) : (
            <span className="text-price text-muted-foreground">—</span>
          )}
        </p>
      </div>

      {/* 4 — ROI (top + left hairline on 2-col → left only on sm+) */}
      <div
        className={cn(
          "border-t border-l border-[var(--p-hair)] p-4",
          !compact && "sm:border-t-0 sm:p-4",
        )}
      >
        <p className="text-eyebrow">{t(lang, "roi")}</p>
        <p className="mt-1.5">
          {hasCost ? (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-price",
                hideBalance
                  ? "text-foreground"
                  : isUp
                    ? "text-price-up"
                    : "text-price-down",
              )}
            >
              {!hideBalance &&
                (isUp ? (
                  <ArrowUp className="size-3" />
                ) : (
                  <ArrowDown className="size-3" />
                ))}
              {hideBalance
                ? "••••"
                : `${isUp ? "+" : ""}${formatPct(stats.unrealizedPnlPercent, 1)}%`}
            </span>
          ) : (
            <span className="text-price text-muted-foreground">—</span>
          )}
        </p>
      </div>
    </Surface>
  )
}

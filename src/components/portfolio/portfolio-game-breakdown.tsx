"use client"

import Image from "next/image"
import { ArrowDown, ArrowUp } from "lucide-react"

import { Surface } from "@/components/ui/surface"
import { getGameAccentTint, getGameConfig } from "@/lib/game-config"
import { DEFAULT_GAME } from "@/lib/game/constants"
import { MASKED } from "@/lib/constants/ui"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/stores/ui-store"
import {
  formatDisplayValue,
  formatPct,
  jpyToDisplayValue,
} from "@/lib/utils/currency"
import type { GameBreakdown } from "@/lib/types/portfolio"

/**
 * "All games" aggregate breakdown panel (VISION §5.7).
 *
 * Returns null when breakdown.length <= 1 — single-game today means no
 * clutter; the panel lights up automatically when a second game has holdings.
 * When two or more games are present, renders a frameless panel with one row
 * per game showing logo, name, card count, value, share bar, and P/L delta.
 */
export function PortfolioGameBreakdown({
  breakdown,
  totalValueJpy,
  onSelect,
  hideBalance = false,
}: {
  breakdown: GameBreakdown[]
  totalValueJpy: number
  /** Deep-link a row into that game's scope by setting the in-page filter.
   *  Omit to render read-only rows (e.g. the hub's cross-portfolio summary,
   *  which has no single game-scoped view to jump to). */
  onSelect?: (game: string) => void
  hideBalance?: boolean
}) {
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)

  // Single game (or empty) — no breakdown clutter.
  if (breakdown.length <= 1) return null

  // Sort descending by value so the largest position is first (gets honey tint).
  const sorted = [...breakdown].sort((a, b) => b.valueJpy - a.valueJpy)
  const valuationComplete = breakdown.every((entry) => entry.valuationComplete)

  return (
    <Surface variant="panel" className="overflow-hidden">
      {/* Panel heading — "by game", NOT "all games" (that's the chip above) */}
      <div className="px-4 pb-2 pt-4 sm:px-5 sm:pt-5">
        <p className="text-h5">{t(lang, "byGame")}</p>
      </div>

      {/* One row per game */}
      <div className="divide-y divide-hair">
        {sorted.map((b) => {
          const hasPerformance = b.performanceComplete && b.pnlPercent != null
          const isUp = (b.pnlPercent ?? 0) >= 0
          // Clamp share to [0, 100] in case of rounding drift.
          const sharePct =
            totalValueJpy > 0
              ? Math.min(100, (b.valueJpy / totalValueJpy) * 100)
              : 0

          // Null-game holdings fold into the default game upstream — resolve the
          // display name from the config so they read as "OPCG", never "other".
          const slug = b.game?.slug ?? DEFAULT_GAME
          const gameName =
            getGameConfig(slug)?.shortName ?? b.game?.name ?? slug.toUpperCase()
          const firstLetter = gameName.charAt(0).toUpperCase()

          const rowClassName = cn(
            "block w-full px-4 py-3 text-left sm:px-5",
            onSelect &&
              "ease-chrome cursor-pointer transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )

          const row = (
            <>
              {/* Top row: logo · name+count · value+delta */}
              <div className="flex items-center gap-3">
                {/* Logo chip — image or letter fallback */}
                <div className="relative size-8 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-hair">
                  {b.game?.logoUrl ? (
                    <Image
                      src={b.game.logoUrl}
                      alt={gameName}
                      fill
                      className="object-contain"
                      sizes="32px"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-micro font-bold text-muted-foreground">
                      {firstLetter}
                    </span>
                  )}
                </div>

                {/* Name + card count */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{gameName}</p>
                  <p className="text-meta tabular-nums">
                    {b.count} {t(lang, "card")}
                  </p>
                </div>

                {/* Value + P/L delta */}
                <div className="shrink-0 text-right">
                  <p className="tabular-nums text-sm font-bold">
                    {hideBalance
                      ? MASKED
                      : b.valuedCopyCount === 0
                        ? "—"
                        : `${b.valuationComplete ? "" : "≈ "}${formatDisplayValue(
                            jpyToDisplayValue(b.valueJpy, currency),
                            currency,
                          )}`}
                  </p>
                  {hasPerformance && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-0.5 tabular-nums text-micro font-semibold",
                        hideBalance
                          ? "text-foreground"
                          : isUp
                            ? "text-price-up"
                            : "text-price-down",
                      )}
                    >
                      {!hideBalance &&
                        (isUp ? (
                          <ArrowUp className="size-3" aria-hidden />
                        ) : (
                          <ArrowDown className="size-3" aria-hidden />
                        ))}
                      {hideBalance
                        ? MASKED
                        : `${formatPct(Math.abs(b.pnlPercent ?? 0), 1)}%`}
                    </span>
                  )}
                </div>
              </div>

              {/* Share bar — each game carries its own thin tint over honey */}
              {valuationComplete && (
                <div
                  className="mt-2 h-1 overflow-hidden rounded-full bg-muted/60"
                  role="presentation"
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${sharePct}%`,
                      background: `color-mix(in srgb, ${getGameAccentTint(slug)} 55%, transparent)`,
                    }}
                  />
                </div>
              )}
            </>
          )

          return onSelect ? (
            <button key={slug} type="button" onClick={() => onSelect(slug)} className={rowClassName}>
              {row}
            </button>
          ) : (
            <div key={slug} className={rowClassName}>
              {row}
            </div>
          )
        })}
      </div>
    </Surface>
  )
}

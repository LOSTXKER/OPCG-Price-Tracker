"use client"

import { useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowDown, ArrowUp } from "lucide-react"

import { cn } from "@/lib/utils"
import { useUIStore } from "@/stores/ui-store"
import { t, getCardName } from "@/lib/i18n"
import {
  jpyToDisplayValue,
  formatDisplayValue,
  formatPct,
} from "@/lib/utils/currency"
import { MASKED } from "@/lib/constants/ui"
import { DEFAULT_GAME } from "@/lib/game/constants"
import type { AssetRow } from "@/lib/types/portfolio"

export type PortfolioMover = {
  row: AssetRow
  swingJpy: number | null
  pct: number
}

/**
 * Derive the 24-hour money move from the current price and its percentage
 * change. `pct` is measured against the previous price, so multiplying the
 * current price by pct directly would overstate gains.
 */
export function getMoverSwingJpy(
  currentPrice: number | null,
  pct: number,
  quantity: number,
): number | null {
  if (
    currentPrice == null ||
    !Number.isFinite(currentPrice) ||
    currentPrice < 0 ||
    !Number.isFinite(pct) ||
    pct <= -100 ||
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {
    return null
  }

  return (currentPrice * pct * quantity) / (100 + pct)
}

export function getPortfolioMovers(
  assets: AssetRow[],
  limit = 3,
): PortfolioMover[] {
  return assets
    .filter(
      (row) =>
        row.priceChange24h != null &&
        row.priceChange24h !== 0 &&
        row.quantity > 0,
    )
    .map((row) => {
      const pct = row.priceChange24h as number
      return {
        row,
        pct,
        swingJpy: getMoverSwingJpy(row.currentPrice, pct, row.quantity),
      }
    })
    .sort((a, b) => {
      const impactDiff = Math.abs(b.swingJpy ?? 0) - Math.abs(a.swingJpy ?? 0)
      return impactDiff !== 0 ? impactDiff : Math.abs(b.pct) - Math.abs(a.pct)
    })
    .slice(0, Math.max(0, Math.trunc(limit)))
}

export function PortfolioMovers({
  assets,
  hideBalance = false,
  limit = 3,
  showHeading = true,
}: {
  assets: AssetRow[]
  hideBalance?: boolean
  limit?: number
  showHeading?: boolean
}) {
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)

  const movers = useMemo(
    () => getPortfolioMovers(assets, limit),
    [assets, limit],
  )

  return (
    <section data-slot="portfolio-movers">
      {showHeading ? (
        <h2 className="mb-3 text-h5">{t(lang, "todaysMovers")}</h2>
      ) : null}

      {movers.length === 0 ? (
        <p className="text-meta py-2">{t(lang, "noData24h")}</p>
      ) : (
        <div className="space-y-1">
          {movers.map(({ row, swingJpy, pct }) => {
            const up = pct > 0
            const name = getCardName(lang, row)
            const code = row.baseCode ?? row.cardCode
            const absSwingDisplay =
              swingJpy == null
                ? null
                : formatDisplayValue(
                    jpyToDisplayValue(Math.abs(swingJpy), currency),
                    currency,
                  )

            const rowInner = (
              <>
                {/* Card thumbnail */}
                <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-hair">
                  {row.imageUrl ? (
                    <Image
                      src={row.imageUrl}
                      alt={name}
                      fill
                      className="object-contain"
                      sizes="40px"
                    />
                  ) : null}
                </div>

                {/* Card name + qty / code */}
                <div className="min-w-0 flex-1">
                  <p className="text-body-sm truncate font-medium">{name}</p>
                  <p className="text-meta tabular-nums">
                    {row.quantity}&times; {code}
                  </p>
                </div>

                {/* Trailing: money swing + percent */}
                <div className="shrink-0 text-right">
                  <p
                    className={cn(
                      "font-price tabular-nums text-body-sm font-semibold",
                      up ? "text-price-up" : "text-price-down",
                    )}
                  >
                    {hideBalance
                      ? MASKED
                      : absSwingDisplay == null
                        ? "—"
                        : `${up ? "+" : "-"}${absSwingDisplay}`}
                  </p>
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 font-price tabular-nums text-micro",
                      up ? "text-price-up" : "text-price-down",
                    )}
                  >
                    {up ? (
                      <ArrowUp className="size-3" />
                    ) : (
                      <ArrowDown className="size-3" />
                    )}
                    {formatPct(Math.abs(pct), 1)}%
                  </span>
                </div>
              </>
            )

            return code ? (
              <Link
                key={row.itemId}
                href={`/${row.game?.slug ?? DEFAULT_GAME}/cards/${code}`}
                className="ease-chrome flex min-h-11 items-center gap-3 py-2 transition-colors hover:bg-muted/40"
              >
                {rowInner}
              </Link>
            ) : (
              <div key={row.itemId} className="flex min-h-11 items-center gap-3 py-2">
                {rowInner}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

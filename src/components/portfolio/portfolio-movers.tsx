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
import type { AssetRow } from "@/lib/types/portfolio"

type Mover = {
  row: AssetRow
  swingJpy: number
  pct: number
}

export function PortfolioMovers({
  assets,
  hideBalance = false,
  variant = "list",
}: {
  assets: AssetRow[]
  hideBalance?: boolean
  /** "list" = full rows (money + pct) · "inline" = quiet one-line text rail. */
  variant?: "list" | "inline"
}) {
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)

  const movers = useMemo<Mover[]>(() => {
    return assets
      .filter(
        (r) =>
          r.priceChange24h != null &&
          r.priceChange24h !== 0 &&
          r.quantity > 0,
      )
      .map((r) => {
        const pct = r.priceChange24h as number
        const swingJpy = (pct / 100) * (r.currentPrice ?? 0) * r.quantity
        return { row: r, swingJpy, pct }
      })
      .sort((a, b) => Math.abs(b.swingJpy) - Math.abs(a.swingJpy))
      .slice(0, 5)
  }, [assets])

  // Quiet one-line rail — plain words on the canvas (no chips, no rings, no
  // avatars); the ticker-tape read. Hidden entirely when nothing moved.
  if (variant === "inline") {
    if (movers.length === 0) return null
    return (
      <div className="flex min-w-0 items-baseline gap-4">
        <span className="text-eyebrow shrink-0">{t(lang, "todaysMovers")}</span>
        <div className="no-sb flex min-w-0 items-baseline gap-x-5 overflow-x-auto">
          {movers.map(({ row, pct }) => {
            const up = pct > 0
            const name = getCardName(lang, row)
            const code = row.baseCode ?? row.cardCode
            return (
              <Link
                key={row.itemId}
                href={code ? `/opcg/cards/${code}` : "#"}
                className="ease-chrome flex shrink-0 items-baseline gap-1.5 transition-colors hover:text-foreground"
              >
                <span className="max-w-32 truncate text-body-sm text-muted-foreground">
                  {name}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 tabular-nums text-micro font-semibold",
                    up ? "text-price-up" : "text-price-down",
                  )}
                >
                  {up ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
                  {formatPct(Math.abs(pct), 1)}%
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div>
      <p className="text-eyebrow mb-3">{t(lang, "todaysMovers")}</p>

      {movers.length === 0 ? (
        <p className="text-meta py-2">{t(lang, "noData24h")}</p>
      ) : (
        <div className="divide-y divide-hair">
          {movers.map(({ row, swingJpy, pct }) => {
            const up = pct > 0
            const name = getCardName(lang, row)
            const code = row.baseCode ?? row.cardCode
            const absSwingDisplay = formatDisplayValue(
              jpyToDisplayValue(Math.abs(swingJpy), currency),
              currency,
            )

            return (
              <Link
                key={row.itemId}
                href={code ? `/opcg/cards/${code}` : "#"}
                className="ease-chrome flex min-h-11 items-center gap-3 py-2 transition-colors hover:bg-muted/40"
              >
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
                      "tabular-nums text-body-sm font-semibold",
                      up ? "text-price-up" : "text-price-down",
                    )}
                  >
                    {hideBalance
                      ? MASKED
                      : `${up ? "+" : "-"}${absSwingDisplay}`}
                  </p>
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 tabular-nums text-micro",
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
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

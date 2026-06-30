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
}: {
  assets: AssetRow[]
  hideBalance?: boolean
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

  return (
    <div>
      <p className="text-eyebrow mb-3">{t(lang, "todaysMovers")}</p>

      {movers.length === 0 ? (
        <p className="text-meta py-2">{t(lang, "noData24h")}</p>
      ) : (
        <div className="divide-y divide-[var(--p-hair)]">
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
                href={code ? `/cards/${code}` : "#"}
                className="ease-chrome flex min-h-11 items-center gap-3 py-2 transition-colors hover:bg-muted/40"
              >
                {/* Card thumbnail */}
                <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-[var(--p-hair)]">
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
                      "font-price text-body-sm font-semibold tabular-nums",
                      up ? "text-price-up" : "text-price-down",
                    )}
                  >
                    {hideBalance
                      ? MASKED
                      : `${up ? "+" : "-"}${absSwingDisplay}`}
                  </p>
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 font-price text-micro tabular-nums",
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

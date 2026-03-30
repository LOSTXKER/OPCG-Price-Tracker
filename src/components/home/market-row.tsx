"use client"

import { memo } from "react"
import Image from "next/image"
import Link from "next/link"

import { RarityBadge } from "@/components/shared/rarity-badge"
import { WatchlistStar } from "@/components/shared/watchlist-star"
import { Price } from "@/components/shared/price-inline"
import { PriceUsd } from "@/components/shared/price-usd"
import { Sparkline } from "@/components/shared/sparkline"
import { Skeleton } from "@/components/ui/skeleton"
import { getCardName } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import { changeToneClass, formatSignedPct } from "@/lib/utils/currency"
import type { CardRow, PriceMode } from "./market-types"

export const MarketRow = memo(function MarketRow({
  card,
  rank,
  showViews,
  sparklineData,
  priceMode = "raw",
}: {
  card: CardRow
  rank: number
  showViews?: boolean
  sparklineData?: number[]
  priceMode?: PriceMode
}) {
  const lang = useUIStore((s) => s.language)
  const name = getCardName(lang, card)
  const c24 = card.priceChange24h
  const c7 = card.priceChange7d
  const c30 = card.priceChange30d
  const setCode = card.set?.code ?? card.setCode ?? ""
  const isPsa = priceMode === "psa10"

  return (
    <tr className="border-b border-border/30 transition-colors duration-150 even:bg-muted/20 hover:bg-muted/50">
      <td className="py-3 pl-3 pr-0 align-middle">
        {card.id != null && <WatchlistStar cardId={card.id} size="sm" />}
      </td>
      <td className="py-3 pr-1 pl-1 align-middle">
        <span className="font-price text-xs text-muted-foreground">{rank}</span>
      </td>
      <td className="py-3 pr-3 pl-2 align-middle">
        <Link
          href={`/cards/${card.cardCode}`}
          className="flex items-center gap-3"
        >
          <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
            {card.imageUrl ? (
              <Image
                src={card.imageUrl}
                alt={name}
                fill
                className="object-contain"
                sizes="40px"
              />
            ) : (
              <div className="size-full bg-muted" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium leading-tight hover:text-primary">
              {name}
            </p>
            <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
              {card.baseCode ?? card.cardCode}
              {card.isParallel && (
                <span className="ml-1 text-primary">P</span>
              )}
            </p>
          </div>
        </Link>
      </td>
      <td className="hidden py-3 pr-3 align-middle font-mono text-xs text-muted-foreground md:table-cell">
        {setCode.toUpperCase()}
      </td>
      <td className="hidden py-3 pr-3 align-middle sm:table-cell">
        <RarityBadge rarity={card.rarity} size="sm" />
      </td>
      <td className="py-3 pr-3 text-right align-middle font-price text-sm font-semibold">
        {isPsa ? (
          card.psa10PriceUsd != null ? (
            <PriceUsd usd={card.psa10PriceUsd} />
          ) : (
            <span className="text-muted-foreground/50">—</span>
          )
        ) : (
          card.latestPriceJpy != null ? (
            <Price jpy={card.latestPriceJpy} />
          ) : (
            "—"
          )
        )}
      </td>
      <td className="py-3 pr-3 text-right align-middle">
        {isPsa ? <span className="font-price text-xs text-muted-foreground">—</span> : <ChangeCell value={c24} />}
      </td>
      <td className="hidden py-3 pr-3 text-right align-middle md:table-cell">
        {showViews ? (
          <span className="font-price text-xs text-muted-foreground">
            {(card.viewCount ?? 0).toLocaleString()}
          </span>
        ) : isPsa ? (
          <span className="font-price text-xs text-muted-foreground">—</span>
        ) : (
          <ChangeCell value={c7} />
        )}
      </td>
      {!showViews && (
        <td className="hidden py-3 pr-3 text-right align-middle lg:table-cell">
          {isPsa ? <span className="font-price text-xs text-muted-foreground">—</span> : <ChangeCell value={c30} />}
        </td>
      )}
      <td className="hidden py-3 pr-4 align-middle xl:table-cell">
        {sparklineData && sparklineData.length >= 2 ? (
          <Sparkline data={sparklineData} width={80} height={28} />
        ) : (
          <span className="text-muted-foreground/30">—</span>
        )}
      </td>
    </tr>
  )
})

export function ChangeCell({ value }: { value?: number | null }) {
  return (
    <span className={cn("font-price text-xs font-medium tabular-nums", changeToneClass(value))}>
      {formatSignedPct(value)}
    </span>
  )
}

export function TableRowSkeleton() {
  return (
    <tr className="border-b border-border/40">
      <td className="py-2.5 pl-3 pr-0">
        <Skeleton className="size-3.5 rounded-full" />
      </td>
      <td className="py-2.5 pr-1 pl-1">
        <Skeleton className="h-4 w-5" />
      </td>
      <td className="py-2.5 pr-3 pl-2">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-2.5 w-16" />
          </div>
        </div>
      </td>
      <td className="hidden py-2.5 pr-3 md:table-cell">
        <Skeleton className="h-3.5 w-10" />
      </td>
      <td className="hidden py-2.5 pr-3 sm:table-cell">
        <Skeleton className="h-5 w-10" />
      </td>
      <td className="py-2.5 pr-3">
        <Skeleton className="ml-auto h-4 w-14" />
      </td>
      <td className="py-2.5 pr-3">
        <Skeleton className="ml-auto h-4 w-10" />
      </td>
      <td className="hidden py-2.5 pr-3 md:table-cell">
        <Skeleton className="ml-auto h-4 w-10" />
      </td>
      <td className="hidden py-2.5 pr-3 lg:table-cell">
        <Skeleton className="ml-auto h-4 w-10" />
      </td>
      <td className="hidden py-2.5 pr-4 xl:table-cell">
        <Skeleton className="h-7 w-20" />
      </td>
    </tr>
  )
}

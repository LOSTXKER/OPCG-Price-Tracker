"use client"

import { memo } from "react"
import Image from "next/image"
import Link from "next/link"

import { CardImageButton } from "@/components/shared/card-image-button"
import { RarityBadge } from "@/components/shared/rarity-badge"
import { WatchlistHeart } from "@/components/shared/watchlist-heart"
import { Price } from "@/components/shared/price-inline"
import { PriceUsd } from "@/components/shared/price-usd"
import { MiniSparkline } from "@/components/ui/mini-sparkline"
import { Skeleton } from "@/components/ui/skeleton"
import { getCardName } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import { formatCount } from "@/lib/utils/currency"
import type { CardRow, PriceMode } from "@/components/home/market-types"

import type { MarketColumn } from "./market-columns"
import { PriceTag } from "@/components/ui/price-tag"

function cellClass(col: MarketColumn) {
  return cn(
    "py-3 align-middle",
    col.key === "star" ? "pl-3 pr-0" : col.key === "rank" ? "px-1" : "pr-3 pl-2",
    col.cell,
    col.align === "right" && "text-right",
  )
}

function Dash() {
  return <span className="font-price text-xs text-muted-foreground/40">—</span>
}

export const MarketTableRow = memo(function MarketTableRow({
  card,
  rank,
  columns,
  priceMode = "raw",
  sparkline,
}: {
  card: CardRow
  rank: number
  columns: MarketColumn[]
  priceMode?: PriceMode
  sparkline?: number[]
}) {
  const lang = useUIStore((s) => s.language)
  const name = getCardName(lang, card)
  const setCode = card.set?.code ?? card.setCode ?? ""
  const isPsa = priceMode === "psa10"

  function renderCell(col: MarketColumn) {
    switch (col.key) {
      case "star":
        return card.id != null ? <WatchlistHeart cardId={card.id} size="sm" /> : null
      case "rank":
        return <span className="font-price text-xs text-muted-foreground">{rank}</span>
      case "card":
        return (
          <div className="flex items-center gap-3">
            {card.imageUrl ? (
              <CardImageButton
                card={{
                  cardCode: card.cardCode,
                  cardId: card.id ?? null,
                  nameJp: card.nameJp,
                  nameEn: card.nameEn,
                  nameTh: card.nameTh,
                  rarity: card.rarity,
                  imageUrl: card.imageUrl,
                  setCode: card.set?.code ?? card.setCode ?? null,
                  priceJpy: card.latestPriceJpy ?? null,
                  priceChange24h: card.priceChange24h ?? null,
                  priceChange7d: card.priceChange7d ?? null,
                  priceChange30d: card.priceChange30d ?? null,
                  psa10PriceUsd: card.psa10PriceUsd ?? null,
                }}
                className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted"
              >
                <Image src={card.imageUrl} alt={name} fill className="object-contain" sizes="40px" />
              </CardImageButton>
            ) : (
              <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted" />
            )}
            <Link href={`/cards/${card.cardCode}`} className="min-w-0">
              <p className="truncate text-sm font-medium leading-tight hover:underline">{name}</p>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                {card.baseCode ?? card.cardCode}
                {card.isParallel && <span className="ml-1 text-muted-foreground/70">P</span>}
              </p>
            </Link>
          </div>
        )
      case "set":
        return setCode ? (
          <Link
            href={`/sets/${setCode}`}
            className="ease-chrome font-mono text-xs text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground hover:decoration-solid"
          >
            {setCode.toUpperCase()}
          </Link>
        ) : null
      case "rarity":
        return <RarityBadge rarity={card.rarity} size="sm" />
      case "price":
        return (
          <span className="text-price">
            {isPsa ? (
              card.psa10PriceUsd != null ? <PriceUsd usd={card.psa10PriceUsd} /> : <Dash />
            ) : card.latestPriceJpy != null ? (
              <Price jpy={card.latestPriceJpy} />
            ) : (
              <Dash />
            )}
          </span>
        )
      case "change24h":
        return isPsa ? <Dash /> : <PriceTag change={card.priceChange24h} changeOnly changeStyle="plain" showArrow={false} size="sm" />
      case "change7d":
        return isPsa ? <Dash /> : <PriceTag change={card.priceChange7d} changeOnly changeStyle="plain" showArrow={false} size="sm" />
      case "change30d":
        return isPsa ? <Dash /> : <PriceTag change={card.priceChange30d} changeOnly changeStyle="plain" showArrow={false} size="sm" />
      case "views":
        return <span className="font-price text-xs text-muted-foreground">{formatCount(card.viewCount ?? 0)}</span>
      case "sparkline":
        return !isPsa && sparkline && sparkline.length >= 2 ? (
          <MiniSparkline data={sparkline} width={88} height={28} className="inline-block align-middle" />
        ) : null
      default:
        return null
    }
  }

  return (
    <tr className="ease-chrome hover:bg-muted/70">
      {columns.map((col) => (
        <td key={col.key} className={cellClass(col)}>
          {renderCell(col)}
        </td>
      ))}
    </tr>
  )
})

export function MarketTableRowSkeleton({ columns }: { columns: MarketColumn[] }) {
  return (
    <tr>
      {columns.map((col) => (
        <td key={col.key} className={cellClass(col)}>
          {col.key === "card" ? (
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-sm" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-2.5 w-16" />
              </div>
            </div>
          ) : col.key === "star" || col.key === "rank" ? (
            <Skeleton className="h-4 w-5" />
          ) : col.key === "rarity" ? (
            <Skeleton className="h-5 w-10" />
          ) : (
            <Skeleton className={cn("h-4 w-14", col.align === "right" && "ml-auto")} />
          )}
        </td>
      ))}
    </tr>
  )
}

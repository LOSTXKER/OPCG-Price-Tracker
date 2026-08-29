"use client"

import { memo } from "react"
import Image from "next/image"
import Link from "next/link"

import { CardImageButton } from "@/components/shared/card-image-button"
import { RarityBadge } from "@/components/shared/rarity-badge"
import { WatchlistHeart } from "@/components/shared/watchlist-heart"
import { ArtStyleBadge } from "@/components/shared/art-style-badge"
import { Price } from "@/components/shared/price-inline"
import { PriceUsd } from "@/components/shared/price-usd"
import { MiniSparkline } from "@/components/ui/mini-sparkline"
import { Skeleton } from "@/components/ui/skeleton"
import { getCardName } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import { formatCount } from "@/lib/utils/currency"
import type { CardRow } from "@/components/home/market-types"
import {
  getGradePriceUsd,
  isRawGrade,
  type GradeKey,
} from "@/lib/pricing/grade-tiers"

import type { MarketColumn } from "./market-columns"
import { marketTableCellClass } from "./market-table-layout"
import { PriceTag } from "@/components/ui/price-tag"

function Dash() {
  return <span className="font-price text-xs text-muted-foreground/40">—</span>
}

export const MarketTableRow = memo(function MarketTableRow({
  card,
  rank,
  columns,
  grade = "raw",
  sparkline,
}: {
  card: CardRow
  rank: number
  columns: MarketColumn[]
  grade?: GradeKey
  sparkline?: number[]
}) {
  const lang = useUIStore((s) => s.language)
  const name = getCardName(lang, card)
  const setCode = card.set?.code ?? card.setCode ?? ""
  const rawGrade = isRawGrade(grade)
  const gradePriceUsd = getGradePriceUsd(card.psa10PriceUsd, grade)

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
            <Link href={`/opcg/cards/${card.cardCode}`} className="min-w-0">
              <p className="flex min-w-0 items-center gap-1.5 text-sm font-medium leading-tight">
                <span className="truncate hover:underline">{name}</span>
                <ArtStyleBadge cardCode={card.cardCode} />
              </p>
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
            href={`/opcg/sets/${setCode}`}
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
            {!rawGrade ? (
              gradePriceUsd != null ? (
                <PriceUsd usd={gradePriceUsd} />
              ) : <Dash />
            ) : card.latestPriceJpy != null ? (
              <Price jpy={card.latestPriceJpy} />
            ) : (
              <Dash />
            )}
          </span>
        )
      case "change24h":
        return rawGrade ? <PriceTag change={card.priceChange24h} changeOnly changeStyle="plain" showArrow={false} size="sm" /> : <Dash />
      case "change7d":
        return rawGrade ? <PriceTag change={card.priceChange7d} changeOnly changeStyle="plain" showArrow={false} size="sm" /> : <Dash />
      case "change30d":
        return rawGrade ? <PriceTag change={card.priceChange30d} changeOnly changeStyle="plain" showArrow={false} size="sm" /> : <Dash />
      case "views":
        return <span className="font-price text-xs text-muted-foreground">{formatCount(card.viewCount ?? 0)}</span>
      case "sparkline":
        return rawGrade && sparkline && sparkline.length >= 2 ? (
          <MiniSparkline data={sparkline} width={88} height={28} className="inline-block align-middle" />
        ) : <Dash />
      default:
        return null
    }
  }

  return (
    <tr className="ease-chrome hover:bg-muted/70">
      {columns.map((col) => (
        <td key={col.key} className={marketTableCellClass(col)}>
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
        <td key={col.key} className={marketTableCellClass(col)}>
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

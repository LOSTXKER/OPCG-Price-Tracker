"use client"

import { memo } from "react"
import Image from "next/image"
import Link from "next/link"

import { RarityBadge } from "@/components/shared/rarity-badge"
import { Price } from "@/components/shared/price-inline"
import { PriceUsd } from "@/components/shared/price-usd"
import { Skeleton } from "@/components/ui/skeleton"
import { getCardName } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import { changeToneClass, formatSignedPct } from "@/lib/utils/currency"
import type { CardRow, PriceMode } from "./market-types"

export const MobileCardItem = memo(function MobileCardItem({
  card,
  rank,
  priceMode = "raw",
}: {
  card: CardRow
  rank: number
  priceMode?: PriceMode
}) {
  const lang = useUIStore((s) => s.language)
  const name = getCardName(lang, card)
  const c24 = card.priceChange24h
  const isPsa = priceMode === "psa10"

  return (
    <Link
      href={`/cards/${card.cardCode}`}
      className="flex items-center gap-3 px-4 py-3 transition-colors active:bg-muted/40"
    >
      <span className="w-5 shrink-0 text-center font-price text-xs text-muted-foreground">{rank}</span>
      <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-muted">
        {card.imageUrl ? (
          <Image src={card.imageUrl} alt={name} fill className="object-contain" sizes="44px" />
        ) : (
          <div className="size-full bg-muted" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">{name}</p>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="font-mono">{card.baseCode ?? card.cardCode}</span>
          <RarityBadge rarity={card.rarity} size="sm" />
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-price text-sm font-semibold">
          {isPsa ? (
            card.psa10PriceUsd != null ? <PriceUsd usd={card.psa10PriceUsd} /> : <span className="text-muted-foreground/50">—</span>
          ) : (
            card.latestPriceJpy != null ? <Price jpy={card.latestPriceJpy} /> : "—"
          )}
        </p>
        {!isPsa && c24 != null && c24 !== 0 && (
          <p className={cn("font-price text-[11px] font-medium", changeToneClass(c24))}>
            {formatSignedPct(c24)}
          </p>
        )}
      </div>
    </Link>
  )
})

export function MobileCardSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Skeleton className="h-4 w-5" />
      <Skeleton className="size-11 rounded-lg" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-2.5 w-16" />
      </div>
      <div className="space-y-1">
        <Skeleton className="ml-auto h-4 w-14" />
        <Skeleton className="ml-auto h-3 w-8" />
      </div>
    </div>
  )
}

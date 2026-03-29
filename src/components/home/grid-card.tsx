"use client"

import { memo } from "react"
import Image from "next/image"
import Link from "next/link"

import { RarityBadge } from "@/components/shared/rarity-badge"
import { PriceDisplay } from "@/components/shared/price-display"
import { WatchlistStar } from "@/components/shared/watchlist-star"
import { PriceUsd } from "@/components/shared/price-usd"
import { Skeleton } from "@/components/ui/skeleton"
import { getCardName } from "@/lib/i18n"
import { BLUR_DATA_URL } from "@/lib/constants/ui"
import { useUIStore } from "@/stores/ui-store"
import type { CardRow, PriceMode, ChangePeriod } from "./market-types"

export const GridCard = memo(function GridCard({
  card,
  changePeriod = "7d",
  priceMode = "raw",
}: {
  card: CardRow
  changePeriod?: ChangePeriod
  priceMode?: PriceMode
}) {
  const lang = useUIStore((s) => s.language)
  const name = getCardName(lang, card)
  const setCode = card.set?.code ?? card.setCode ?? ""
  const isPsa = priceMode === "psa10"
  const activeChange = isPsa
    ? undefined
    : changePeriod === "24h" ? card.priceChange24h
    : changePeriod === "30d" ? card.priceChange30d
    : card.priceChange7d

  return (
    <Link
      href={`/cards/${card.cardCode}`}
      className="group/card block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="panel relative flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <div className="relative aspect-[63/88] w-full bg-muted">
          {card.imageUrl ? (
            <Image
              src={card.imageUrl}
              alt={name}
              fill
              className="object-contain"
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 18vw"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
            />
          ) : (
            <div className="size-full bg-muted" />
          )}
          <div className="absolute left-1.5 top-1.5 z-10">
            {card.id != null && <WatchlistStar cardId={card.id} size="sm" />}
          </div>
          {card.isParallel && (
            <div className="absolute right-1.5 top-1.5">
              <span className="rounded-md bg-primary/90 px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                P
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-2.5">
          <div className="mb-1 flex items-center gap-1.5">
            <RarityBadge rarity={card.rarity} size="sm" />
            {setCode && (
              <span className="font-mono text-[10px] text-muted-foreground">
                {setCode.toUpperCase()}
              </span>
            )}
          </div>
          <p className="truncate text-[13px] font-medium leading-snug" title={name}>
            {name}
          </p>
          <div className="mt-auto pt-1.5">
            {isPsa ? (
              card.psa10PriceUsd != null ? (
                <PriceUsd usd={card.psa10PriceUsd} className="text-sm font-semibold" />
              ) : (
                <span className="font-price text-sm text-muted-foreground/50">—</span>
              )
            ) : (
              <PriceDisplay
                priceJpy={card.latestPriceJpy}
                change={activeChange}
                size="sm"
              />
            )}
          </div>
        </div>
      </div>
    </Link>
  )
})

export function GridCardSkeleton() {
  return (
    <div className="panel overflow-hidden">
      <Skeleton className="aspect-[63/88] w-full" />
      <div className="space-y-2 p-2.5">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  )
}

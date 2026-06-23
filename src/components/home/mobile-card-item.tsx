"use client"

import { memo } from "react"
import Image from "next/image"
import Link from "next/link"

import { CardImageButton } from "@/components/shared/card-image-button"
import { RarityBadge } from "@/components/shared/rarity-badge"
import { Price } from "@/components/shared/price-inline"
import { PriceUsd } from "@/components/shared/price-usd"
import { Skeleton } from "@/components/ui/skeleton"
import { getCardName } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import type { CardRow, PriceMode } from "./market-types"
import { Sparkline } from "@/components/shared/sparkline"
import { ChangePill } from "@/components/market/change-pill"

export const MobileCardItem = memo(function MobileCardItem({
  card,
  rank,
  priceMode = "raw",
  sparkline,
}: {
  card: CardRow
  rank: number
  priceMode?: PriceMode
  sparkline?: number[]
}) {
  const lang = useUIStore((s) => s.language)
  const name = getCardName(lang, card)
  const c24 = card.priceChange24h
  const isPsa = priceMode === "psa10"

  return (
    <div className="ease-chrome flex items-center gap-3 px-4 py-3 active:bg-muted">
      <span className="w-5 shrink-0 text-center font-price text-xs text-muted-foreground">{rank}</span>
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
          className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-muted"
        >
          <Image src={card.imageUrl} alt={name} fill className="object-contain" sizes="44px" />
        </CardImageButton>
      ) : (
        <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-muted" />
      )}
      <Link
        href={`/cards/${card.cardCode}`}
        className="flex min-w-0 flex-1 items-center gap-3 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-tight">{name}</p>
          <div className="mt-0.5 flex items-center gap-1.5 text-meta">
            <span className="font-mono">{card.baseCode ?? card.cardCode}</span>
            <RarityBadge rarity={card.rarity} size="sm" />
          </div>
        </div>
        {!isPsa && sparkline && sparkline.length >= 2 && (
          <Sparkline data={sparkline} width={48} height={20} className="shrink-0" />
        )}
        <div className="shrink-0 text-right">
          <p className="font-price text-sm font-semibold">
            {isPsa ? (
              card.psa10PriceUsd != null ? <PriceUsd usd={card.psa10PriceUsd} /> : <span className="text-muted-foreground/50">—</span>
            ) : (
              card.latestPriceJpy != null ? <Price jpy={card.latestPriceJpy} /> : "—"
            )}
          </p>
          {!isPsa && c24 != null && <ChangePill value={c24} className="mt-0.5" />}
        </div>
      </Link>
    </div>
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

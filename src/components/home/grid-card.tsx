"use client"

import { memo } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { CardActionRow } from "@/components/shared/card-action-row"
import { RarityBadge } from "@/components/shared/rarity-badge"
import { PriceDisplay } from "@/components/shared/price-display"
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
  const router = useRouter()
  const name = getCardName(lang, card)
  const setCode = card.set?.code ?? card.setCode ?? ""
  const isPsa = priceMode === "psa10"
  const activeChange = isPsa
    ? undefined
    : changePeriod === "24h" ? card.priceChange24h
    : changePeriod === "30d" ? card.priceChange30d
    : card.priceChange7d

  return (
    <div className="panel ease-chrome group/card relative flex flex-col overflow-hidden hover:bg-foreground/[0.04]">
      <Link
        href={`/cards/${card.cardCode}`}
        aria-label={name}
        className="absolute inset-0 z-10 rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

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
      </div>

      <div className="flex flex-1 flex-col p-2.5">
        <div className="mb-0.5 flex items-center gap-1.5">
          <RarityBadge rarity={card.rarity} size="sm" />
          {setCode && (
            <span
              role="link"
              tabIndex={0}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                router.push(`/sets/${setCode}`)
              }}
              className="ease-chrome relative z-20 cursor-pointer font-mono text-xs text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground hover:decoration-solid"
            >
              {setCode.toUpperCase()}
            </span>
          )}
        </div>
        <p className="truncate text-xs leading-snug text-muted-foreground" title={name}>
          {name}
        </p>
        <div className="mt-auto pt-1.5">
          {isPsa ? (
            card.psa10PriceUsd != null ? (
              <PriceUsd usd={card.psa10PriceUsd} className="text-lg font-semibold" />
            ) : (
              <span className="font-price text-lg font-semibold text-muted-foreground/50">—</span>
            )
          ) : (
            <PriceDisplay
              priceJpy={card.latestPriceJpy}
              change={activeChange}
              size="card"
              className="gap-x-1.5"
            />
          )}
        </div>
      </div>

      <CardActionRow
        card={{
          cardCode: card.cardCode,
          cardId: card.id ?? null,
          nameJp: card.nameJp,
          nameEn: card.nameEn,
          nameTh: card.nameTh,
          rarity: card.rarity,
          imageUrl: card.imageUrl ?? null,
          setCode,
        }}
        show={{ detail: true, watchlist: card.id != null, compare: true }}
        className="relative z-20 border-t border-[var(--p-hair)] p-2"
      />
    </div>
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

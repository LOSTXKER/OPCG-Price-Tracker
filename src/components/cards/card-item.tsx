"use client"

import Image from "next/image"
import Link from "next/link"

import { PriceDisplay } from "@/components/shared/price-display"
import { Skeleton } from "@/components/ui/skeleton"
import { BLUR_DATA_URL } from "@/lib/constants/ui"
import { getCardName } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { RarityBadge } from "@/components/shared/rarity-badge"
import { useUIStore } from "@/stores/ui-store"

export interface CardItemProps {
  cardCode: string
  nameJp: string
  nameEn?: string | null
  nameTh?: string | null
  rarity: string
  isParallel?: boolean
  imageUrl?: string | null
  priceJpy?: number | null
  priceThb?: number | null
  priceChange7d?: number | null
  setCode?: string
  inStock?: boolean
}

export function CardItem({
  cardCode,
  nameJp,
  nameEn,
  nameTh,
  rarity,
  isParallel,
  imageUrl,
  priceJpy,
  priceThb,
  priceChange7d,
  setCode,
  inStock = true,
}: CardItemProps) {
  const lang = useUIStore((s) => s.language)
  const displayName = getCardName(lang, { nameEn, nameJp, nameTh })
  return (
    <Link
      href={`/cards/${cardCode}`}
      className="group/card block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded border border-border bg-card transition-colors hover:border-primary/30">
        {/* Image */}
        <div className="relative aspect-[63/88] w-full bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={displayName}
              fill
              className="object-contain"
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 18vw"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
            />
          ) : (
            <Skeleton className="absolute inset-0 size-full" />
          )}

          {/* Top-right badges */}
          <div className="absolute right-1.5 top-1.5 flex flex-col items-end gap-1">
            {!inStock && (
              <span className="rounded bg-destructive/90 px-1.5 py-0.5 text-[9px] font-medium text-white">
                หมด
              </span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col p-2.5">
          <div className="mb-1 flex items-center gap-1.5">
            <RarityBadge rarity={rarity} size="sm" />
            {setCode && (
              <span className="font-mono text-[9px] text-muted-foreground">
                {setCode.toUpperCase()}
              </span>
            )}
          </div>
          <p className="truncate text-[12px] font-medium leading-snug" title={displayName}>
            {displayName}
          </p>
          <div className="mt-auto pt-1.5">
            <PriceDisplay
              priceJpy={priceJpy}
              priceThb={priceThb ?? undefined}
              change={priceChange7d ?? undefined}
              size="sm"
            />
          </div>
        </div>
      </div>
    </Link>
  )
}

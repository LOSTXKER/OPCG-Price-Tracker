"use client"

import Image from "next/image"
import Link from "next/link"

import { PriceDisplay } from "@/components/shared/price-display"
import { Skeleton } from "@/components/ui/skeleton"
import { BLUR_DATA_URL } from "@/lib/constants/ui"
import { getCardName } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { formatPct } from "@/lib/utils/pull-rate"
import { RarityBadge } from "@/components/shared/rarity-badge"
import { useUIStore } from "@/stores/ui-store"

export type ChangePeriod = "24h" | "7d" | "30d"

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
  priceChange24h?: number | null
  priceChange7d?: number | null
  priceChange30d?: number | null
  /** Which period to display; defaults to "7d" */
  changePeriod?: ChangePeriod
  setCode?: string
  inStock?: boolean
  /** Pull probability per box (0-1 range) shown as overlay badge */
  pullChancePerBox?: number
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
  priceChange24h,
  priceChange7d,
  priceChange30d,
  changePeriod = "7d",
  setCode,
  inStock = true,
  pullChancePerBox,
}: CardItemProps) {
  const lang = useUIStore((s) => s.language)
  const displayName = getCardName(lang, { nameEn, nameJp, nameTh })
  const activeChange = changePeriod === "24h" ? priceChange24h : changePeriod === "30d" ? priceChange30d : priceChange7d
  return (
    <Link
      href={`/cards/${cardCode}`}
      className="group/card block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
        <div className="panel relative flex h-full flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
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

          {/* Top-left pull chance badge */}
          {pullChancePerBox != null && pullChancePerBox > 0 && (
            <div className="absolute left-1 top-1">
              <span className="rounded bg-black/70 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white backdrop-blur-sm">
                {formatPct(pullChancePerBox)}
              </span>
            </div>
          )}

          {/* Top-right badges */}
          {!inStock && (
            <div className="absolute right-1.5 top-1.5">
              <span className="rounded bg-destructive/90 px-1.5 py-0.5 text-[10px] font-medium text-white">
                หมด
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col p-2.5">
          <div className="mb-1 flex items-center gap-1.5">
            <RarityBadge rarity={rarity} size="sm" />
            {setCode && (
              <span className="font-mono text-[10px] text-muted-foreground">
                {setCode.toUpperCase()}
              </span>
            )}
          </div>
          <p className="truncate text-[13px] font-medium leading-snug" title={displayName}>
            {displayName}
          </p>
          <div className="mt-auto pt-1.5">
            <PriceDisplay
              priceJpy={priceJpy}
              priceThb={priceThb ?? undefined}
              change={activeChange ?? undefined}
              size="sm"
            />
          </div>
        </div>
      </div>
    </Link>
  )
}

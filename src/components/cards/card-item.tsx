"use client"

import { memo } from "react"
import Image from "next/image"
import Link from "next/link"

import { CardActionRow } from "@/components/shared/card-action-row"
import { PriceTag } from "@/components/ui/price-tag"
import { PriceUsd } from "@/components/shared/price-usd"
import { Skeleton } from "@/components/ui/skeleton"
import { BLUR_DATA_URL } from "@/lib/constants/ui"
import { getCardName } from "@/lib/i18n"
import { RarityBadge } from "@/components/shared/rarity-badge"
import { Surface } from "@/components/ui/surface"
import { useUIStore } from "@/stores/ui-store"

export type ChangePeriod = "24h" | "7d" | "30d"

export interface CardItemProps {
  cardCode: string
  cardId?: number | null
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
  /**
   * Pull probability per box (0-1 range). Currently unused — kept for
   * back-compat with callers; the on-card overlay was removed.
   */
  pullChancePerBox?: number
  psa10PriceUsd?: number | null
  /**
   * Override the bottom action row.
   * - `undefined` (default): render the standard star/compare/detail row
   * - `null`: hide the action row entirely
   * - ReactNode: render the provided node in place of the default row
   *   (caller is responsible for its own border/padding)
   */
  actionRow?: React.ReactNode | null
}

function CardItemBase({
  cardCode,
  cardId,
  nameJp,
  nameEn,
  nameTh,
  rarity,
  imageUrl,
  priceJpy,
  priceThb,
  priceChange24h,
  priceChange7d,
  priceChange30d,
  changePeriod = "7d",
  setCode,
  psa10PriceUsd,
  actionRow,
}: CardItemProps) {
  const lang = useUIStore((s) => s.language)
  const displayName = getCardName(lang, { nameEn, nameJp, nameTh })
  const activeChange =
    changePeriod === "24h"
      ? priceChange24h
      : changePeriod === "30d"
        ? priceChange30d
        : priceChange7d

  const previewCard = {
    cardCode,
    cardId: cardId ?? null,
    nameJp,
    nameEn: nameEn ?? null,
    nameTh: nameTh ?? null,
    rarity,
    imageUrl: imageUrl ?? null,
    setCode: setCode ?? null,
    priceJpy: priceJpy ?? null,
    priceThb: priceThb ?? null,
    priceChange24h: priceChange24h ?? null,
    priceChange7d: priceChange7d ?? null,
    priceChange30d: priceChange30d ?? null,
    psa10PriceUsd: psa10PriceUsd ?? null,
  }

  return (
    <Surface variant="panel" className="group/card hover-lift relative flex h-full flex-col overflow-hidden">
      <Link
        href={`/cards/${cardCode}`}
        aria-label={displayName}
        className="absolute inset-0 z-10 rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

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
      </div>

      <div className="flex flex-1 flex-col p-2.5">
        <div className="mb-0.5 flex items-center gap-1.5">
          <RarityBadge rarity={rarity} size="sm" />
          {setCode && (
            <span className="font-mono text-xs text-muted-foreground">
              {setCode.toUpperCase()}
            </span>
          )}
        </div>
        <p className="truncate text-body-sm" title={displayName}>
          {displayName}
        </p>
        <div className="mt-auto pt-1.5">
          <PriceTag
            jpy={priceJpy}
            thb={priceThb ?? undefined}
            change={activeChange ?? undefined}
            size="card"
            className="gap-x-1.5"
          />
          <div className="mt-1 flex items-baseline gap-1.5 text-meta">
            <span className="font-medium text-amber-500">PSA 10</span>
            {psa10PriceUsd != null ? (
              <PriceUsd usd={psa10PriceUsd} className="text-foreground/70" />
            ) : (
              <span className="font-price text-muted-foreground/60">—</span>
            )}
          </div>
        </div>
      </div>

      {actionRow === undefined ? (
        <CardActionRow
          card={previewCard}
          show={{ detail: true, watchlist: cardId != null, compare: true }}
          className="relative z-20 border-t border-hair p-2"
        />
      ) : actionRow === null ? null : (
        actionRow
      )}
    </Surface>
  )
}

export const CardItem = memo(CardItemBase)

"use client"

import { memo } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

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
  /** Price display. `undefined` = raw price + a secondary PSA10 line (default for
   *  pages with no price toggle: watchlist, drop-calc…). `"raw"` = raw only.
   *  `"psa10"` = PSA10 price as the main price (pages with a Raw/PSA toggle). */
  priceMode?: "raw" | "psa10"
  /** Make the set code a link to /sets/[code] (home/search). Default: plain text. */
  linkSet?: boolean
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
  priceMode,
  linkSet,
  actionRow,
}: CardItemProps) {
  const lang = useUIStore((s) => s.language)
  const router = useRouter()
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
          {setCode &&
            (linkSet ? (
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
            ) : (
              <span className="font-mono text-xs text-muted-foreground">
                {setCode.toUpperCase()}
              </span>
            ))}
        </div>
        <p className="truncate text-body-sm" title={displayName}>
          {displayName}
        </p>
        <div className="mt-auto pt-1.5">
          {priceMode === "psa10" ? (
            psa10PriceUsd != null ? (
              <PriceUsd usd={psa10PriceUsd} className="text-lg font-semibold" />
            ) : (
              <span className="font-price text-lg font-semibold text-muted-foreground/50">
                —
              </span>
            )
          ) : (
            <>
              <PriceTag
                jpy={priceJpy}
                thb={priceThb ?? undefined}
                change={activeChange ?? undefined}
                size="card"
                className="gap-x-1.5"
              />
              {priceMode === undefined && (
                <div className="mt-1 flex items-baseline gap-1.5 text-meta">
                  <span className="font-medium text-amber-500">PSA 10</span>
                  {psa10PriceUsd != null ? (
                    <PriceUsd usd={psa10PriceUsd} className="text-foreground/70" />
                  ) : (
                    <span className="font-price text-muted-foreground/60">—</span>
                  )}
                </div>
              )}
            </>
          )}
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

/** Loading placeholder matching CardItem's shape — for card grids. */
export function CardItemSkeleton() {
  return (
    <Surface variant="panel" className="overflow-hidden">
      <Skeleton className="aspect-[63/88] w-full" />
      <div className="space-y-2 p-2.5">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
    </Surface>
  )
}

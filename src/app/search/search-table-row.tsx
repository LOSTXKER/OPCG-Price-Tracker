"use client"

import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { changeToneClass, formatSignedPct } from "@/lib/utils/currency"
import { RarityBadge } from "@/components/shared/rarity-badge"
import { Price } from "@/components/shared/price-inline"
import { WatchlistStar } from "@/components/shared/watchlist-star"
import { BLUR_DATA_URL } from "@/lib/constants/ui"
import { getCardName } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import type { CardRow as BaseCardRow } from "@/components/home/market-types"

export interface CardRow extends BaseCardRow {
  id: number
  latestPriceThb?: number | null
}

export function SearchTableRow({ card, rank }: { card: CardRow; rank: number }) {
  const lang = useUIStore((s) => s.language)
  const name = getCardName(lang, card)
  const setCode = card.set?.code ?? card.setCode ?? ""
  const c24 = card.priceChange24h
  const c7 = card.priceChange7d
  const c30 = card.priceChange30d

  return (
    <tr className="border-b border-[var(--p-hair)] ease-chrome transition-colors duration-150 even:bg-foreground/[0.02] hover:bg-foreground/[0.04]">
      <td className="py-3 pl-3 pr-0 align-middle">
        {card.id != null && (
          <span onClick={(e) => { e.preventDefault(); e.stopPropagation() }}>
            <WatchlistStar cardId={card.id} size="sm" />
          </span>
        )}
      </td>
      <td className="py-3 pr-1 pl-1 align-middle">
        <span className="font-price text-xs text-muted-foreground">{rank}</span>
      </td>
      <td className="py-3 pr-3 pl-2 align-middle">
        <div className="flex items-center gap-3">
          <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
            {card.imageUrl ? (
              <Image
                src={card.imageUrl}
                alt={name}
                fill
                className="object-contain"
                sizes="40px"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
              />
            ) : (
              <div className="size-full bg-muted" />
            )}
          </div>
          <Link href={`/cards/${card.cardCode}`} className="min-w-0">
            <p className="truncate text-sm font-medium leading-tight hover:text-primary hover:underline">
              {name}
            </p>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
              {card.baseCode ?? card.cardCode}
              {card.isParallel && <span className="ml-1 text-primary">P</span>}
            </p>
          </Link>
        </div>
      </td>
      <td className="hidden py-3 pr-3 align-middle font-mono text-xs text-muted-foreground md:table-cell">
        {setCode && (
          <Link
            href={`/sets/${setCode}`}
            className="underline decoration-dotted underline-offset-2 ease-chrome transition-colors hover:text-primary hover:decoration-solid"
          >
            {setCode.toUpperCase()}
          </Link>
        )}
      </td>
      <td className="hidden py-3 pr-3 align-middle sm:table-cell">
        <RarityBadge rarity={card.rarity} size="sm" />
      </td>
      <td className="py-3 pr-3 text-right align-middle font-price text-sm font-semibold">
        {card.latestPriceJpy != null ? (
          <Price jpy={card.latestPriceJpy} thb={card.latestPriceThb} />
        ) : (
          <span className="text-muted-foreground/40">—</span>
        )}
      </td>
      <td className="py-3 pr-3 text-right align-middle">
        <span className={cn("font-price text-xs font-medium tabular-nums", changeToneClass(c24))}>
          {formatSignedPct(c24)}
        </span>
      </td>
      <td className="hidden py-3 pr-3 text-right align-middle md:table-cell">
        <span className={cn("font-price text-xs font-medium tabular-nums", changeToneClass(c7))}>
          {formatSignedPct(c7)}
        </span>
      </td>
      <td className="hidden py-3 pr-3 text-right align-middle lg:table-cell">
        <span className={cn("font-price text-xs font-medium tabular-nums", changeToneClass(c30))}>
          {formatSignedPct(c30)}
        </span>
      </td>
    </tr>
  )
}

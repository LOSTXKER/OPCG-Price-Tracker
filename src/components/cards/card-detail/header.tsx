"use client"

import Link from "next/link"
import { Eye } from "lucide-react"

import { RarityBadge } from "@/components/shared/rarity-badge"
import { WatchlistStar } from "@/components/shared/watchlist-star"
import { t, type Language } from "@/lib/i18n"
import { formatCount } from "@/lib/utils/currency"

export function CardDetailHeader({
  card,
  setCode,
  setName,
  displayName,
  lang,
}: {
  card: {
    id: number
    cardCode: string
    baseCode: string | null
    rarity: string
    viewCount: number
  }
  setCode: string
  setName: string
  displayName: string
  lang: Language
}) {
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="tnum text-xs text-muted-foreground">
          {card.baseCode ?? card.cardCode}
        </span>
        <RarityBadge rarity={card.rarity} size="sm" />
        <span className="inline-flex items-center gap-1 tnum text-xs text-muted-foreground/60">
          <Eye className="size-3" aria-hidden /> {formatCount(card.viewCount)} {t(lang, "views")}
        </span>
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <h1 className="text-h1 min-w-0 break-words">{displayName}</h1>
        <WatchlistStar cardId={card.id} size="md" />
      </div>
      <p className="mt-1 text-meta">
        <Link
          href={`/sets/${setCode}`}
          className="hover:text-foreground hover:underline underline-offset-4"
        >
          {setCode.toUpperCase()} &middot; {setName}
        </Link>
      </p>
    </div>
  )
}

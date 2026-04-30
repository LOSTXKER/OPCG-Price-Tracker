"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { CompareButton } from "@/components/shared/compare-button"
import { WatchlistStar } from "@/components/shared/watchlist-star"
import type { CardPreviewData } from "@/stores/card-preview-store"
import { useUIStore } from "@/stores/ui-store"
import { getCardName, t } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export function CardActionRow({
  card,
  show = { detail: true, watchlist: true, compare: true },
  className,
  extras,
}: {
  card: CardPreviewData
  show?: {
    detail?: boolean
    watchlist?: boolean
    compare?: boolean
  }
  className?: string
  /** Extra icon-buttons to render on the right side of the row. */
  extras?: React.ReactNode
}) {
  const lang = useUIStore((s) => s.language)
  const name = getCardName(lang, card)

  return (
    <div
      className={cn("flex items-center gap-1.5", className)}
      onClick={(e) => e.stopPropagation()}
    >
      {show.watchlist && card.cardId != null && (
        <WatchlistStar cardId={card.cardId} size="sm" variant="chip" />
      )}
      {show.compare && (
        <CompareButton
          item={{
            cardCode: card.cardCode,
            name,
            imageUrl: card.imageUrl ?? null,
            rarity: card.rarity,
          }}
          size="sm"
          variant="chip"
        />
      )}
      {extras}
      {show.detail && (
        <Link
          href={`/cards/${card.cardCode}`}
          onClick={(e) => e.stopPropagation()}
          aria-label={t(lang, "viewDetails")}
          className="ml-auto inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
        >
          <span className="truncate">{t(lang, "viewDetails")}</span>
          <ArrowUpRight className="size-3.5 shrink-0" />
        </Link>
      )}
    </div>
  )
}

"use client"

import Link from "next/link"
import { ExternalLink } from "lucide-react"

import { CompareButton } from "@/components/shared/compare-button"
import { WatchlistStar } from "@/components/shared/watchlist-star"
import type { CardPreviewData } from "@/stores/card-preview-store"
import { useUIStore } from "@/stores/ui-store"
import { getCardName, t } from "@/lib/i18n"
import { cn } from "@/lib/utils"

const ICON_BTN =
  "inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

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
      className={cn("flex items-center justify-between gap-1 px-1", className)}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-1">
        {show.watchlist && card.cardId != null && (
          <WatchlistStar cardId={card.cardId} size="sm" />
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
          />
        )}
      </div>
      <div className="flex items-center gap-0.5">
        {extras}
        {show.detail && (
          <Link
            href={`/cards/${card.cardCode}`}
            onClick={(e) => e.stopPropagation()}
            aria-label={t(lang, "viewDetails")}
            className={cn(ICON_BTN, "hover:text-primary")}
          >
            <ExternalLink className="size-3.5" />
          </Link>
        )}
      </div>
    </div>
  )
}

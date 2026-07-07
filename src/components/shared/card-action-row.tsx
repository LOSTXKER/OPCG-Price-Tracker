"use client"

import Link from "next/link"
import { ArrowUpRight, MoreHorizontal } from "lucide-react"

import { CompareButton } from "@/components/compare/compare-button"
import { WatchlistHeart } from "@/components/shared/watchlist-heart"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  /** Extra icon-buttons rendered alongside compare (inline on desktop, inside the "…" menu on mobile). */
  extras?: React.ReactNode
}) {
  const lang = useUIStore((s) => s.language)
  const name = getCardName(lang, card)

  const compareItem = {
    cardCode: card.cardCode,
    name,
    imageUrl: card.imageUrl ?? null,
    rarity: card.rarity,
  }

  // The watchlist heart is the PRIMARY action and always stays inline. The
  // secondary actions (compare + host-supplied extras) fold into one 44px "…"
  // menu on mobile so the dense sub-44px chip cluster isn't mis-tapped on
  // phones; desktop keeps them inline (the row has room).
  const hasSecondary = Boolean(show.compare || extras)

  return (
    <div
      className={cn("flex items-center gap-1.5", className)}
      onClick={(e) => e.stopPropagation()}
    >
      {/* PRIMARY — watchlist heart: always inline, never folded. */}
      {show.watchlist && card.cardId != null && (
        <WatchlistHeart cardId={card.cardId} size="sm" variant="chip" />
      )}

      {/* Desktop (≥sm): secondary actions inline, unchanged. */}
      {hasSecondary && (
        <div className="hidden items-center gap-1.5 sm:flex">
          {show.compare && (
            <CompareButton item={compareItem} size="sm" variant="chip" />
          )}
          {extras}
        </div>
      )}

      {/* Mobile (<sm): fold the secondary actions into one 44px "…" menu.
          CompareButton keeps its own toggle/tier-limit/upgrade behavior — we
          only reuse its `ghost` variant (icon + i18n label) as the menu row. */}
      {hasSecondary && (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={t(lang, "moreActions")}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground motion-base hover:bg-muted hover:text-foreground sm:hidden"
          >
            <MoreHorizontal className="size-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {show.compare && (
              <CompareButton
                item={compareItem}
                variant="ghost"
                className="w-full justify-start px-2 py-1.5"
              />
            )}
            {extras}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {show.detail && (
        <Link
          href={`/cards/${card.cardCode}`}
          onClick={(e) => e.stopPropagation()}
          aria-label={t(lang, "viewDetails")}
          className="ml-auto inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground motion-base hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
        >
          <span className="truncate">{t(lang, "viewDetails")}</span>
          <ArrowUpRight className="size-3.5 shrink-0" />
        </Link>
      )}
    </div>
  )
}

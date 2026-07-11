"use client"

import { Bell, Eye, Share2 } from "lucide-react"

import { RarityBadge } from "@/components/shared/rarity-badge"
import { WatchlistHeart } from "@/components/shared/watchlist-heart"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { t, type Language } from "@/lib/i18n"

import type { CardDetailProps } from "./types"

interface CardDetailIdentityProps {
  card: CardDetailProps["card"]
  displayName: string
  lang: Language
  onAlert: () => void
  onShare: () => void
}

/** Card name, identity metadata, and the three quiet header actions. */
export function CardDetailIdentity({
  card,
  displayName,
  lang,
  onAlert,
  onShare,
}: CardDetailIdentityProps) {
  const headerIconButton =
    "ease-chrome flex size-11 shrink-0 items-center justify-center rounded-md border-0 bg-transparent text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:size-9 [&_svg]:size-4"

  return (
    <div className="min-w-0">
      <div className="flex items-center gap-3">
        <h1 className="text-h2 min-w-0 break-words text-foreground sm:text-h1">
          {displayName}
        </h1>
        <div className="flex shrink-0 items-center gap-1">
          <WatchlistHeart
            cardId={card.id}
            size="md"
            className="size-11 rounded-md motion-base hover:bg-muted sm:size-9 [&_svg]:size-4"
          />
          <TooltipProvider delay={200}>
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={onAlert}
                    className={headerIconButton}
                    aria-label={t(lang, "setPriceAlertShort")}
                  >
                    <Bell aria-hidden />
                  </button>
                }
              />
              <TooltipContent>{t(lang, "setPriceAlertShort")}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={onShare}
                    className={headerIconButton}
                    aria-label={t(lang, "shareButton")}
                  >
                    <Share2 aria-hidden />
                  </button>
                }
              />
              <TooltipContent>{t(lang, "shareButton")}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <div className="text-meta mt-1 flex flex-wrap items-center gap-1.5">
        <RarityBadge rarity={card.rarity} size="sm" />
        <span>· {card.baseCode ?? card.cardCode}</span>
        <span
          className="inline-flex items-center gap-1 tnum"
          title={t(lang, "views")}
          aria-label={`${card.viewCount.toLocaleString()} ${t(lang, "views")}`}
        >
          · <Eye className="size-3" aria-hidden /> {card.viewCount.toLocaleString()}
        </span>
      </div>
    </div>
  )
}

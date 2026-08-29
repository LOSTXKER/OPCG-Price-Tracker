"use client"

import { Bell, Eye, Share2 } from "lucide-react"

import { RarityBadge } from "@/components/shared/rarity-badge"
import { ArtStyleBadge } from "@/components/shared/art-style-badge"
import { WatchlistHeart } from "@/components/shared/watchlist-heart"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { t, type Language } from "@/lib/i18n"
import { baseCardCode } from "@/lib/seo/copy/card"

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
        {/* Owner decision (เบส, 2026-08-04): the heading shows the card name
            only — the code competed with the name visually when it was tried
            inline. SEO round 2: 82% of cards share a name, so a code-less H1
            text also repeated across printings ("Monkey.D.Luffy" on 109 pages)
            and never carried the "ราคา" query intent. Both are restored to the
            H1's *accessible* text only (sr-only), so the crawlable/AT text is
            "ราคา {name} {code}" while the rendered pixels are unchanged — the
            code is still visible right below in the meta line. */}
        <h1 className="text-h2 min-w-0 break-words text-foreground sm:text-h1">
          <span className="sr-only">{t(lang, "price")} </span>
          {displayName}
          <span className="sr-only"> {baseCardCode(card.cardCode)}</span>
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
        <ArtStyleBadge cardCode={card.cardCode} />
        {/* The official card number, without our internal `_p3` printing suffix
            (owner decision) — the rarity badge beside it already says P-SEC. */}
        <span>· {baseCardCode(card.cardCode)}</span>
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

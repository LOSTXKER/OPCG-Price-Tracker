"use client"

import { useState } from "react"
import { Bell, Share2 } from "lucide-react"

import { CardAddToPortfolio } from "@/components/cards/card-add-to-portfolio"
import { CardSetAlertDialog } from "@/components/cards/card-set-alert-dialog"
import { CompareButton } from "@/components/shared/compare-button"
import { t, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"

const ACTION_BTN =
  "ease-chrome inline-flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-border/55 bg-transparent px-3 text-sm font-semibold text-muted-foreground hover:border-border hover:bg-foreground/[0.035] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

/**
 * Card-detail header actions — one compact row of utilities:
 * Add-to-portfolio (labelled) + Share + Alert + Compare. Lives top-right of the
 * page header; the primary Buy/Sell live with the grade selector instead.
 */
export function CardDetailActions({
  cardId,
  cardCode,
  displayName,
  rarity,
  imageUrl,
  currentPriceJpy,
  lang,
  className,
}: {
  cardId: number
  cardCode: string
  displayName: string
  rarity: string
  imageUrl: string | null
  currentPriceJpy: number | null
  lang: Language
  className?: string
}) {
  const [alertOpen, setAlertOpen] = useState(false)

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : ""
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: displayName, url })
      } else {
        await navigator.clipboard?.writeText(url)
      }
    } catch {
      /* user dismissed the share sheet — nothing to do */
    }
  }

  return (
    <div className={cn("grid w-full grid-cols-2 gap-2 sm:grid-cols-4", className)}>
      <CardAddToPortfolio
        cardId={cardId}
        cardName={displayName}
        variant="outline"
        className="h-11 justify-center rounded-xl text-sm"
      />

      <button type="button" onClick={() => void handleShare()} className={ACTION_BTN}>
        <Share2 className="size-4 shrink-0" aria-hidden />
        <span className="truncate">{t(lang, "shareButton")}</span>
      </button>

      <button type="button" onClick={() => setAlertOpen(true)} className={ACTION_BTN}>
        <Bell className="size-4 shrink-0" aria-hidden />
        <span className="truncate">{t(lang, "setPriceAlertShort")}</span>
      </button>
      <CardSetAlertDialog
        cardId={cardId}
        cardName={displayName}
        currentPriceJpy={currentPriceJpy}
        open={alertOpen}
        onOpenChange={setAlertOpen}
      />

      <CompareButton
        item={{ cardCode, name: displayName, imageUrl, rarity }}
        size="md"
        variant="label"
        className="h-11 justify-center rounded-xl text-sm"
      />
    </div>
  )
}

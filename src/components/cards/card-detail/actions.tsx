"use client"

import { useState } from "react"
import { Bell, Share2 } from "lucide-react"

import { CardAddToPortfolio } from "@/components/cards/card-add-to-portfolio"
import { CardSetAlertDialog } from "@/components/cards/card-set-alert-dialog"
import { CompareButton } from "@/components/shared/compare-button"
import { useUIStore } from "@/stores/ui-store"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"

const ICON_BTN =
  "ease-chrome flex size-10 shrink-0 items-center justify-center rounded-xl border border-border surface-2 text-muted-foreground hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

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
  className,
}: {
  cardId: number
  cardCode: string
  displayName: string
  rarity: string
  imageUrl: string | null
  currentPriceJpy: number | null
  className?: string
}) {
  const lang = useUIStore((s) => s.language)
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
    <div className={cn("flex items-center gap-2", className)}>
      <CardAddToPortfolio
        cardId={cardId}
        cardName={displayName}
        variant="outline"
        className="h-10 rounded-xl px-3.5 text-sm"
      />

      <button type="button" onClick={() => void handleShare()} aria-label={t(lang, "shareButton")} title={t(lang, "shareButton")} className={ICON_BTN}>
        <Share2 className="size-4" />
      </button>

      <button type="button" onClick={() => setAlertOpen(true)} aria-label={t(lang, "setPriceAlertShort")} title={t(lang, "setPriceAlertShort")} className={ICON_BTN}>
        <Bell className="size-4" />
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
        variant="chip"
        className="size-10 shrink-0 rounded-xl"
      />
    </div>
  )
}

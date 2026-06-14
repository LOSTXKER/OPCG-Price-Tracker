"use client"

import { useState } from "react"
import { Bell } from "lucide-react"

import { CardAddToPortfolio } from "@/components/cards/card-add-to-portfolio"
import { CardSetAlertDialog } from "@/components/cards/card-set-alert-dialog"
import { CompareButton } from "@/components/shared/compare-button"
import { useUIStore } from "@/stores/ui-store"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"

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

  return (
    <div className={cn("flex w-full flex-col gap-2", className)}>
      {/* Primary CTA — fills the column width like the proto (one dominant gold
          action), substantial height + rounded-xl so it reads as the page's
          single call-to-action rather than one pill among many. */}
      <CardAddToPortfolio
        cardId={cardId}
        cardName={displayName}
        className="h-11 w-full justify-center rounded-xl px-5 text-sm font-bold"
      />

      {/* Secondary actions — two equal halves so the cluster stays balanced and
          never wraps unevenly. Neutral bordered pills (gold reserved for the
          primary above). */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setAlertOpen(true)}
          className="ease-chrome inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Bell className="size-3.5" />
          {t(lang, "setPriceAlertShort")}
        </button>

        <CompareButton
          item={{ cardCode, name: displayName, imageUrl, rarity }}
          size="sm"
          variant="label"
          className="h-10 flex-1 justify-center rounded-xl"
        />
      </div>

      <CardSetAlertDialog
        cardId={cardId}
        cardName={displayName}
        currentPriceJpy={currentPriceJpy}
        open={alertOpen}
        onOpenChange={setAlertOpen}
      />
    </div>
  )
}

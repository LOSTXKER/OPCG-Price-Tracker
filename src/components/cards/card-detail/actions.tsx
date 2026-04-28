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
    <div className={cn("flex w-full flex-wrap items-center gap-2 sm:w-auto", className)}>
      {/* Primary CTA stretches on mobile so it remains thumb-friendly, but
          shrinks to its content on >= sm so it doesn't look oversized when
          placed in a wide right-column on desktop. */}
      <CardAddToPortfolio
        cardId={cardId}
        cardName={displayName}
        className="h-9 flex-1 justify-center px-5 sm:flex-none"
      />

      <button
        type="button"
        onClick={() => setAlertOpen(true)}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
      >
        <Bell className="size-3.5" />
        {t(lang, "setPriceAlertShort")}
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
        size="sm"
        variant="label"
        className="h-9 rounded-md"
      />
    </div>
  )
}

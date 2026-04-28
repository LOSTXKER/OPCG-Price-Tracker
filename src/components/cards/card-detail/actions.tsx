"use client"

import { CardAddToPortfolio } from "@/components/cards/card-add-to-portfolio"
import { CardSetAlertDialog } from "@/components/cards/card-set-alert-dialog"
import { CompareButton } from "@/components/shared/compare-button"

export function CardDetailActions({
  cardId,
  cardCode,
  displayName,
  rarity,
  imageUrl,
  currentPriceJpy,
}: {
  cardId: number
  cardCode: string
  displayName: string
  rarity: string
  imageUrl: string | null
  currentPriceJpy: number | null
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <CardAddToPortfolio cardId={cardId} cardName={displayName} />
      <CardSetAlertDialog
        cardId={cardId}
        cardName={displayName}
        currentPriceJpy={currentPriceJpy}
      />
      <CompareButton
        item={{ cardCode, name: displayName, imageUrl, rarity }}
        variant="label"
      />
    </div>
  )
}

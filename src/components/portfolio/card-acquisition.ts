import type { Currency } from "@/lib/i18n"
import { MAX_LISTING_QUANTITY } from "@/lib/constants/ui"
import { displayValueToJpy } from "@/lib/utils/currency"

import { parseCostValue } from "./assets-table/utils"
import type { CardWithSet, CartItem } from "./add-card-types"

export type CardAcquisitionDraft = {
  quantity: number
  purchasePrice: string
  acquiredAt: string
  lotNote: string
}

export type CardAcquisitionDrafts = Record<number, CardAcquisitionDraft>

export function createCardAcquisitionDraft(
  defaultAcquiredAt: string,
): CardAcquisitionDraft {
  return {
    quantity: 1,
    purchasePrice: "",
    acquiredAt: defaultAcquiredAt,
    lotNote: "",
  }
}

export function getCardAcquisitionDraft(
  drafts: CardAcquisitionDrafts,
  cardId: number,
  defaultAcquiredAt: string,
): CardAcquisitionDraft {
  return drafts[cardId] ?? createCardAcquisitionDraft(defaultAcquiredAt)
}

export function getRemainingHoldingCapacity(existingQuantity: number): number {
  return Math.max(0, MAX_LISTING_QUANTITY - existingQuantity)
}

export function isCardAcquisitionDraftValid({
  draft,
  existingQuantity,
}: {
  draft: CardAcquisitionDraft
  existingQuantity: number
}): boolean {
  const parsedCost = parseCostValue(draft.purchasePrice)
  const maxQuantity = getRemainingHoldingCapacity(existingQuantity)

  return (
    parsedCost != null &&
    parsedCost >= 0 &&
    Number.isInteger(draft.quantity) &&
    draft.quantity >= 1 &&
    draft.quantity <= maxQuantity &&
    draft.acquiredAt !== ""
  )
}

export function buildAcquisitionCartItems({
  cards,
  drafts,
  defaultAcquiredAt,
  currency,
  existingHoldingQuantities = {},
}: {
  cards: CardWithSet[]
  drafts: CardAcquisitionDrafts
  defaultAcquiredAt: string
  currency: Currency
  existingHoldingQuantities?: Record<number, number>
}): CartItem[] | null {
  const items: CartItem[] = []

  for (const card of cards) {
    const draft = getCardAcquisitionDraft(
      drafts,
      card.id,
      defaultAcquiredAt,
    )
    if (
      !isCardAcquisitionDraftValid({
        draft,
        existingQuantity: existingHoldingQuantities[card.id] ?? 0,
      })
    ) {
      return null
    }

    const parsedCost = parseCostValue(draft.purchasePrice)
    if (parsedCost == null) return null

    items.push({
      card,
      quantity: draft.quantity,
      purchasePrice: Math.round(displayValueToJpy(parsedCost, currency)),
      acquiredAt: draft.acquiredAt,
      lotNote: draft.lotNote.trim() || null,
    })
  }

  return items
}

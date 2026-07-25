import { describe, expect, it } from "vitest"

import type { CardWithSet } from "./card-picker-form"
import {
  getNextCardBatchSelection,
  shouldAcceptCardBatchPickerOpenChange,
} from "./card-batch-picker-dialog"

describe("CardBatchPickerDialog pending guard", () => {
  it("blocks dismissal while cards are being added", () => {
    expect(shouldAcceptCardBatchPickerOpenChange(false, true)).toBe(false)
    expect(shouldAcceptCardBatchPickerOpenChange(false, false)).toBe(true)
    expect(shouldAcceptCardBatchPickerOpenChange(true, true)).toBe(true)
  })
})

describe("CardBatchPickerDialog selection limit", () => {
  const card = (id: number): CardWithSet => ({
    id,
    cardCode: `TEST-${id}`,
    nameJp: `Card ${id}`,
    nameEn: `Card ${id}`,
    rarity: "C",
    imageUrl: null,
    latestPriceJpy: null,
  })

  it("blocks a new pick at the limit but still allows deselection", () => {
    const current = [card(1), card(2)]
    expect(getNextCardBatchSelection(current, card(3), 2)).toEqual({
      cards: current,
      limitReached: true,
    })
    expect(getNextCardBatchSelection(current, current[0]!, 2)).toEqual({
      cards: [current[1]],
      limitReached: false,
    })
  })
})

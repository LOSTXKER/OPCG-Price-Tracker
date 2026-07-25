import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { Dialog } from "@/components/ui/dialog"
import { useUIStore } from "@/stores/ui-store"

import type { CardWithSet } from "./add-card-types"
import { AddCardDetailStep } from "./add-card-detail-step"
import {
  buildAcquisitionCartItems,
  createCardAcquisitionDraft,
  getRemainingHoldingCapacity,
} from "./card-acquisition"

const card: CardWithSet = {
  id: 7,
  cardCode: "OP01-001",
  nameJp: "ロロノア・ゾロ",
  nameEn: "Roronoa Zoro",
  rarity: "L",
  imageUrl: null,
  latestPriceJpy: 100,
}

const secondCard: CardWithSet = {
  ...card,
  id: 8,
  cardCode: "OP05-119_p2",
  nameEn: "Monkey.D.Luffy (Parallel)",
}

describe("buildAcquisitionCartItems", () => {
  it("rejects a new purchase without a cost per card", () => {
    expect(
      buildAcquisitionCartItems({
        cards: [card],
        drafts: {
          [card.id]: {
            quantity: 2,
            purchasePrice: "",
            acquiredAt: "2026-07-23",
            lotNote: "  bought at an event  ",
          },
        },
        defaultAcquiredAt: "2026-07-24",
        currency: "JPY",
      }),
    ).toBeNull()
  })

  it("keeps zero as a valid free-card cost", () => {
    const result = buildAcquisitionCartItems({
      cards: [card],
      drafts: {
        [card.id]: {
          quantity: 1,
          purchasePrice: "0",
          acquiredAt: "2026-07-23",
          lotNote: "",
        },
      },
      defaultAcquiredAt: "2026-07-24",
      currency: "JPY",
    })

    expect(result?.[0]).toMatchObject({
      purchasePrice: 0,
      acquiredAt: "2026-07-23",
      lotNote: null,
    })
  })

  it("rejects a new purchase without an acquisition date", () => {
    expect(
      buildAcquisitionCartItems({
        cards: [card],
        drafts: {
          [card.id]: {
            quantity: 1,
            purchasePrice: "100",
            acquiredAt: "",
            lotNote: "",
          },
        },
        defaultAcquiredAt: "2026-07-24",
        currency: "JPY",
      }),
    ).toBeNull()
  })

  it("converts the display currency to JPY per card", () => {
    const result = buildAcquisitionCartItems({
      cards: [card],
      drafts: {
        [card.id]: {
          quantity: 1,
          purchasePrice: "100",
          acquiredAt: "2026-07-23",
          lotNote: "",
        },
      },
      defaultAcquiredAt: "2026-07-24",
      currency: "THB",
    })

    expect(result?.[0]?.purchasePrice).toBeGreaterThan(100)
  })

  it("rejects invalid or negative costs", () => {
    expect(
      buildAcquisitionCartItems({
        cards: [card],
        drafts: {
          [card.id]: {
            quantity: 1,
            purchasePrice: "-1",
            acquiredAt: "2026-07-23",
            lotNote: "",
          },
        },
        defaultAcquiredAt: "2026-07-24",
        currency: "JPY",
      }),
    ).toBeNull()
  })

  it("keeps the acquisition date and note separate for every selected card", () => {
    const result = buildAcquisitionCartItems({
      cards: [card, secondCard],
      drafts: {
        [card.id]: {
          quantity: 2,
          purchasePrice: "100",
          acquiredAt: "2026-07-20",
          lotNote: "  ร้าน A  ",
        },
        [secondCard.id]: {
          quantity: 1,
          purchasePrice: "0",
          acquiredAt: "2026-07-24",
          lotNote: "",
        },
      },
      defaultAcquiredAt: "2026-07-24",
      currency: "JPY",
    })

    expect(result).toEqual([
      {
        card,
        quantity: 2,
        purchasePrice: 100,
        acquiredAt: "2026-07-20",
        lotNote: "ร้าน A",
      },
      {
        card: secondCard,
        quantity: 1,
        purchasePrice: 0,
        acquiredAt: "2026-07-24",
        lotNote: null,
      },
    ])
  })

  it("creates untouched per-card drafts with today's date and an empty note", () => {
    expect(createCardAcquisitionDraft("2026-07-24")).toEqual({
      quantity: 1,
      purchasePrice: "",
      acquiredAt: "2026-07-24",
      lotNote: "",
    })
  })

  it("stops adding copies once the holding reaches the shared limit", () => {
    expect(getRemainingHoldingCapacity(998)).toBe(1)
    expect(getRemainingHoldingCapacity(999)).toBe(0)

    expect(
      buildAcquisitionCartItems({
        cards: [card],
        drafts: {
          [card.id]: {
            quantity: 2,
            purchasePrice: "100",
            acquiredAt: "2026-07-24",
            lotNote: "",
          },
        },
        defaultAcquiredAt: "2026-07-24",
        currency: "JPY",
        existingHoldingQuantities: { [card.id]: 998 },
      }),
    ).toBeNull()
  })
})

describe("AddCardDetailStep guidance", () => {
  it("explains that an existing card becomes a new purchase lot", () => {
    useUIStore.setState({ language: "TH", currency: "THB" })

    const html = renderToStaticMarkup(
      createElement(
        Dialog,
        { open: true },
        createElement(AddCardDetailStep, {
          cards: [card, secondCard],
          drafts: {},
          onDraftChange: () => {},
          defaultAcquiredAt: "2026-07-23",
          existingHoldingQuantities: { [card.id]: 2 },
          submitting: false,
          onBack: () => {},
          onSubmit: () => {},
        }),
      ),
    )

    expect(html).toContain("มีในพอร์ตแล้ว")
    expect(html).toContain("จะเพิ่มเป็นรายการซื้อใหม่")
    expect(html).toContain("ซื้อพร้อมกันเท่านั้น")
    expect(
      html.match(/data-slot="portfolio-acquisition-card"/g),
    ).toHaveLength(2)
    expect(
      html.match(/data-slot="portfolio-acquisition-form"/g),
    ).toHaveLength(1)
    expect(
      html.match(/data-slot="portfolio-acquisition-fields"/g),
    ).toHaveLength(2)
    expect(
      html.match(/data-slot="portfolio-acquisition-date"/g),
    ).toHaveLength(2)
    expect(
      html.match(/data-slot="portfolio-acquisition-note"/g),
    ).toHaveLength(2)
    expect(html).toContain("sm:items-start")
    expect(html).not.toContain("sm:items-end")
    expect(html).not.toContain("sm:grid-cols-3")
    expect(html).toContain(
      "ต้นทุนต่อใบ · Roronoa Zoro OP01-001",
    )
    expect(html).toContain("จำนวน · Roronoa Zoro OP01-001")
    expect(html).toContain('id="add-card-date-7"')
    expect(html).toContain('id="add-card-date-8"')
    expect(html).toContain('id="add-card-note-7"')
    expect(html).toContain('id="add-card-note-8"')
    expect(html).toContain("เพิ่มโน้ต")
    expect(html).toContain("group-open:hidden")
    expect(html).toContain("group-open:inline")
    expect(html).not.toContain("ใช้กับการ์ดที่เลือกทุกใบ")
    expect(html).toContain("ถ้าได้มาฟรีให้ใส่ 0")
    expect(html.match(/required=""/g)).toHaveLength(4)
  })
})

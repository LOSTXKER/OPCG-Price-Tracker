import { describe, expect, it, vi } from "vitest"

import type { CardWithSet } from "@/components/portfolio/add-card-types"
import type { CardAcquisitionFormProps } from "@/components/portfolio/card-acquisition-form"

import {
  getAutomaticPortfolioId,
  getPortfolioCardQuantity,
} from "./card-add-to-portfolio"

type TestElement = {
  type: unknown
  props: Record<string, unknown> & { children?: unknown }
}

const card: CardWithSet = {
  id: 7,
  cardCode: "OP01-001",
  nameJp: "ロロノア・ゾロ",
  nameEn: "Roronoa Zoro",
  rarity: "L",
  imageUrl: null,
  latestPriceJpy: 100,
}

function collectElements(
  node: unknown,
  result: TestElement[] = [],
): TestElement[] {
  if (Array.isArray(node)) {
    node.forEach((child) => collectElements(child, result))
    return result
  }
  if (!node || typeof node !== "object" || !("props" in node)) {
    return result
  }

  const element = node as TestElement
  result.push(element)
  collectElements(element.props.children, result)
  collectElements(element.props.beforeCards, result)
  return result
}

function createHookHarness() {
  const slots: unknown[] = []
  let cursor = 0

  const nextSlot = (initial: unknown) => {
    const index = cursor
    cursor += 1
    if (!(index in slots)) {
      slots[index] =
        typeof initial === "function"
          ? (initial as () => unknown)()
          : initial
    }
    return index
  }

  return {
    beginRender() {
      cursor = 0
    },
    useState(initial: unknown) {
      const index = nextSlot(initial)
      return [
        slots[index],
        (next: unknown) => {
          slots[index] =
            typeof next === "function"
              ? (next as (current: unknown) => unknown)(slots[index])
              : next
        },
      ]
    },
    useRef(initial: unknown) {
      const index = nextSlot({ current: initial })
      return slots[index]
    },
    useEffect() {},
    useId() {
      const index = nextSlot(`test-id-${cursor}`)
      return slots[index]
    },
  }
}

describe("card-detail portfolio selection", () => {
  it("auto-selects only when exactly one portfolio is available", () => {
    expect(getAutomaticPortfolioId([])).toBeNull()
    expect(getAutomaticPortfolioId([{ id: 9 }])).toBe(9)
    expect(getAutomaticPortfolioId([{ id: 9 }, { id: 10 }])).toBeNull()
  })

  it("passes the selected portfolio's existing card quantity to the shared form", () => {
    expect(
      getPortfolioCardQuantity(
        {
          id: 9,
          name: "Main",
          isPublic: false,
          items: [
            { cardId: 7, quantity: 3, condition: "NM" },
            { cardId: 7, quantity: 4, condition: "LP" },
            { cardId: 8, quantity: 1, condition: "NM" },
          ],
        },
        7,
      ),
    ).toBe(3)
    expect(
      getPortfolioCardQuantity(
        {
          id: 9,
          name: "Main",
          isPublic: false,
          items: [
            { cardId: 7, quantity: 3, condition: "NM" },
            { cardId: 7, quantity: 4, condition: "LP" },
          ],
        },
        7,
        "LP",
      ),
    ).toBe(4)
    expect(getPortfolioCardQuantity(null, 7)).toBe(0)
  })
})

describe("CardAddToPortfolio shared acquisition flow", () => {
  it("renders the canonical form and submits its date, free cost, and note", async () => {
    const hooks = createHookHarness()
    const apiGet = vi.fn(async () => ({
      portfolios: [
        {
          id: 9,
          name: "Test",
          isPublic: false,
          items: [{ cardId: 7, quantity: 2, condition: "NM" }],
        },
        {
          id: 10,
          name: "Archive",
          isPublic: true,
          items: [],
        },
      ],
    }))
    let resolveApiPost: ((value: unknown) => void) | undefined
    const apiPost = vi.fn(
      () =>
        new Promise<unknown>((resolve) => {
          resolveApiPost = resolve
        }),
    )

    vi.resetModules()
    vi.doMock("react", async () => ({
      ...(await vi.importActual<typeof import("react")>("react")),
      useState: hooks.useState,
      useRef: hooks.useRef,
      useEffect: hooks.useEffect,
      useId: hooks.useId,
    }))
    vi.doMock("@/lib/api/client", () => ({
      ApiError: class ApiError extends Error {
        status = 500
      },
      apiGet,
      apiPost,
    }))
    vi.doMock("@/stores/ui-store", () => ({
      useUIStore: (
        selector: (state: { language: "TH"; currency: "JPY" }) => unknown,
      ) => selector({ language: "TH", currency: "JPY" }),
    }))

    const [
      { CardAddToPortfolio: IsolatedCardAddToPortfolio },
      { CardAcquisitionForm: IsolatedCardAcquisitionForm },
    ] = await Promise.all([
      import("./card-add-to-portfolio"),
      import("@/components/portfolio/card-acquisition-form"),
    ])

    const render = () => {
      hooks.beginRender()
      return IsolatedCardAddToPortfolio({
        card,
        cardName: "Roronoa Zoro",
      })
    }

    let tree = render()
    const trigger = collectElements(tree).find(
      (element) =>
        typeof element.props.onClick === "function" &&
        element.props.type !== "submit",
    )
    expect(trigger).toBeDefined()
    ;(trigger?.props.onClick as () => void)()

    await vi.waitFor(() => expect(apiGet).toHaveBeenCalledOnce())
    await Promise.resolve()
    await Promise.resolve()

    tree = render()
    const portfolioSelect = collectElements(tree).find(
      (element) =>
        typeof element.props.onValueChange === "function" &&
        "value" in element.props,
    )
    expect(portfolioSelect?.props.value).toBe("")
    ;(portfolioSelect?.props.onValueChange as (value: string) => void)(
      "9",
    )

    tree = render()
    let form = collectElements(tree).find(
      (element) => element.type === IsolatedCardAcquisitionForm,
    )
    expect(form).toBeDefined()
    expect(form?.props.cards).toEqual([card])
    expect(form?.props.existingHoldingQuantities).toEqual({ 7: 2 })
    expect(form?.props.cancelLabel).toBe("ยกเลิก")

    const formProps = form?.props as unknown as CardAcquisitionFormProps
    formProps.onDraftChange(card.id, {
      purchasePrice: "0",
      acquiredAt: "2026-07-24",
      lotNote: "  ร้าน A  ",
    })

    tree = render()
    form = collectElements(tree).find(
      (element) => element.type === IsolatedCardAcquisitionForm,
    )
    ;(
      form?.props as unknown as CardAcquisitionFormProps
    ).onSubmit()

    await vi.waitFor(() => expect(apiPost).toHaveBeenCalledOnce())
    expect(apiPost).toHaveBeenCalledWith(
      "/api/portfolio/items/batch",
      {
        portfolioId: 9,
        requestId: expect.any(String),
        items: [
          {
            cardId: 7,
            quantity: 1,
            purchasePrice: 0,
            acquiredAt: "2026-07-24",
            lotNote: "ร้าน A",
            condition: "NM",
          },
        ],
      },
    )

    tree = render()
    const pendingPortfolioSelect = collectElements(tree).find(
      (element) =>
        typeof element.props.onValueChange === "function" &&
        "value" in element.props,
    )
    expect(pendingPortfolioSelect?.props.disabled).toBe(true)

    resolveApiPost?.({})
    await vi.waitFor(() => {
      tree = render()
      expect(
        collectElements(tree).find(
          (element) => element.props.role === "status",
        ),
      ).toBeDefined()
    })

    vi.doUnmock("react")
    vi.doUnmock("@/lib/api/client")
    vi.doUnmock("@/stores/ui-store")
    vi.resetModules()
  })
})

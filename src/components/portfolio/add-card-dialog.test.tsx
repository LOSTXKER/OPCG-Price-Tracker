import { isValidElement, type ReactElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { CardBatchPickerReviewContext } from "@/components/shared/card-batch-picker-dialog"
import type { CardWithSet } from "@/components/shared/card-picker-form"
import type { PortfolioBatchResult } from "@/lib/types/portfolio"

const dialogHarness = vi.hoisted(() => ({
  props: null as null | {
    reviewLabel: (count: number) => unknown
    renderReview: (context: CardBatchPickerReviewContext) => unknown
    submittingLabel?: unknown
    maxSelection?: number
    selectionLimitLabel?: unknown
  },
  success: vi.fn(),
  error: vi.fn(),
}))

vi.mock("@/components/shared/card-batch-picker-dialog", () => ({
  CardBatchPickerDialog: (props: NonNullable<typeof dialogHarness.props>) => {
    dialogHarness.props = props
    return <div data-testid="batch-picker" />
  },
}))

vi.mock("sonner", () => ({
  toast: {
    success: dialogHarness.success,
    error: dialogHarness.error,
  },
}))

import { AddCardDialog } from "./add-card-dialog"

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

const successResult: PortfolioBatchResult = {
  ok: true,
  status: 200,
  error: null,
  data: { added: 1, updated: 0 },
  failed: 0,
}

function createHookHarness() {
  const slots: unknown[] = []
  let cursor = 0

  return {
    beginRender() {
      cursor = 0
    },
    useState(initial: unknown) {
      const index = cursor
      cursor += 1
      if (!(index in slots)) {
        slots[index] =
          typeof initial === "function" ? (initial as () => unknown)() : initial
      }
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
    useEffect() {},
  }
}

describe("AddCardDialog feedback", () => {
  beforeEach(() => {
    dialogHarness.props = null
    dialogHarness.success.mockReset()
    dialogHarness.error.mockReset()
  })

  it("prefills the purchase date and blocks a blank cost before saving", () => {
    const onAddBatch = vi.fn(async () => successResult)

    renderToStaticMarkup(
      <AddCardDialog
        open
        onOpenChange={vi.fn()}
        onAddBatch={onAddBatch}
        portfolioName="Test"
      />,
    )

    expect(dialogHarness.props?.submittingLabel).toBe("กำลังบันทึก…")
    expect(dialogHarness.props?.maxSelection).toBe(100)
    expect(dialogHarness.props?.selectionLimitLabel).toContain("100")
    expect(dialogHarness.props?.reviewLabel(1)).toContain("รายละเอียด")

    const submissionHarness = {
      submitter: null as (() => Promise<boolean | void>) | null,
    }
    const review = dialogHarness.props?.renderReview({
      cards: [card],
      submitting: false,
      onBack: vi.fn(),
      onSubmit: (nextSubmitter) => {
        submissionHarness.submitter = nextSubmitter
      },
    })
    expect(isValidElement(review)).toBe(true)
    const reviewProps = (
      review as ReactElement<{
        defaultAcquiredAt: string
        onSubmit: () => void
      }>
    ).props
    expect(reviewProps.defaultAcquiredAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    reviewProps.onSubmit()

    expect(submissionHarness.submitter).toBeNull()
    expect(onAddBatch).not.toHaveBeenCalled()
    expect(dialogHarness.success).not.toHaveBeenCalled()
    expect(dialogHarness.error).not.toHaveBeenCalled()
  })

  it("submits separate dates and notes for each selected card", async () => {
    const hooks = createHookHarness()
    const onAddBatch = vi.fn(async () => successResult)
    const onOpenChange = vi.fn()

    vi.resetModules()
    vi.doMock("react", async () => ({
      ...(await vi.importActual<typeof import("react")>("react")),
      useState: hooks.useState,
      useEffect: hooks.useEffect,
    }))
    vi.doMock("@/stores/ui-store", () => ({
      useUIStore: (
        selector: (state: { language: "TH"; currency: "JPY" }) => unknown,
      ) => selector({ language: "TH", currency: "JPY" }),
    }))

    const { AddCardDialog: IsolatedAddCardDialog } = await import(
      "./add-card-dialog"
    )
    const render = () => {
      hooks.beginRender()
      const wrapper = IsolatedAddCardDialog({
        open: true,
        onOpenChange,
        onAddBatch,
        portfolioName: "Test",
      })
      expect(typeof wrapper.type).toBe("function")
      const dialog = (
        wrapper.type as (props: typeof wrapper.props) => ReactElement
      )(wrapper.props)
      dialogHarness.props = dialog.props as NonNullable<
        typeof dialogHarness.props
      >
    }

    render()
    const draftReview = dialogHarness.props?.renderReview({
      cards: [card, secondCard],
      submitting: false,
      onBack: vi.fn(),
      onSubmit: vi.fn(),
    }) as ReactElement<{
      onDraftChange: (
        cardId: number,
        patch: {
          purchasePrice?: string
          acquiredAt?: string
          lotNote?: string
        },
      ) => void
    }>
    draftReview.props.onDraftChange(card.id, {
      purchasePrice: "100",
      acquiredAt: "2026-07-20",
      lotNote: "ร้าน A",
    })
    draftReview.props.onDraftChange(secondCard.id, {
      purchasePrice: "0",
      acquiredAt: "2026-07-24",
      lotNote: "",
    })

    render()
    const submission = {
      submitter: null as (() => Promise<boolean | void>) | null,
    }
    const submitReview = dialogHarness.props?.renderReview({
      cards: [card, secondCard],
      submitting: false,
      onBack: vi.fn(),
      onSubmit: (nextSubmitter) => {
        submission.submitter = nextSubmitter
      },
    }) as ReactElement<{ onSubmit: () => void }>
    submitReview.props.onSubmit()

    expect(submission.submitter).not.toBeNull()
    if (!submission.submitter) throw new Error("submitter was not registered")
    await submission.submitter()
    expect(onAddBatch).toHaveBeenCalledOnce()
    expect(onAddBatch).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          card: expect.objectContaining({ id: 7 }),
          quantity: 1,
          purchasePrice: 100,
          acquiredAt: "2026-07-20",
          lotNote: "ร้าน A",
        }),
        expect.objectContaining({
          card: expect.objectContaining({ id: 8 }),
          quantity: 1,
          purchasePrice: 0,
          acquiredAt: "2026-07-24",
          lotNote: null,
        }),
      ],
      expect.any(String),
    )

    vi.doUnmock("react")
    vi.doUnmock("@/stores/ui-store")
    vi.resetModules()
  })
})

import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { MASKED } from "@/lib/constants/ui"
import { t } from "@/lib/i18n"
import type { AssetRow } from "@/lib/types/portfolio"

import {
  getDirectCostLotId,
  getInitialPurchaseLotEditor,
  getMaxPurchaseLotQuantity,
  hasHoldingDetailsChanges,
  HoldingDetails,
  isDirectPurchaseLotEdit,
  isPurchaseLotFormValid,
  PurchaseLotsList,
} from "./purchase-lots-dialog"

const row: AssetRow = {
  itemId: 1,
  cardId: 1,
  cardCode: "OP01-001_p1",
  baseCode: "OP01-001",
  nameJp: "ロロノア・ゾロ",
  nameEn: "Roronoa Zoro",
  rarity: "L",
  imageUrl: null,
  quantity: 3,
  lots: [
    {
      id: 10,
      quantity: 1,
      unitCostJpy: 100,
      acquiredAt: null,
      note: "ของเดิมก่อนแยกรายการ",
      source: "LEGACY_OPENING_BALANCE",
      createdAt: "2026-07-23T00:00:00.000Z",
      updatedAt: "2026-07-23T00:00:00.000Z",
    },
    {
      id: 11,
      quantity: 2,
      unitCostJpy: 200,
      acquiredAt: "2026-07-10T00:00:00.000Z",
      note: "ซื้อเพิ่มจากร้าน",
      source: "MANUAL",
      createdAt: "2026-07-23T00:00:00.000Z",
      updatedAt: "2026-07-23T00:00:00.000Z",
    },
  ],
  lotCount: 2,
  recordedCostJpy: 500,
  costedCopyCount: 3,
  purchasePrice: 167,
  currentPrice: 300,
  currentPriceThb: null,
  priceChange24h: null,
  priceChange7d: null,
  condition: "NM",
  notes: null,
  game: null,
}

type TestElement = {
  type: unknown
  props: Record<string, unknown> & { children?: unknown }
}

function collectElements(node: unknown, result: TestElement[] = []): TestElement[] {
  if (Array.isArray(node)) {
    node.forEach((child) => collectElements(child, result))
    return result
  }
  if (!node || typeof node !== "object" || !("props" in node)) return result

  const element = node as TestElement
  result.push(element)
  collectElements(element.props.children, result)
  return result
}

function nodeText(node: unknown): string {
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(nodeText).join("")
  if (!node || typeof node !== "object" || !("props" in node)) return ""
  return nodeText((node as TestElement).props.children)
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
  }
}

describe("portfolio purchase lots", () => {
  it("caps a new purchase at 999 total copies while preserving edit headroom", () => {
    expect(getMaxPurchaseLotQuantity(998)).toBe(1)
    expect(getMaxPurchaseLotQuantity(999)).toBe(0)
    expect(getMaxPurchaseLotQuantity(999, 3)).toBe(3)
  })

  it("requires date and cost only when creating a new purchase", () => {
    const shared = {
      acquiredAt: "2026-07-24",
      quantity: 1,
      maxQuantity: 999,
    }

    expect(
      isPurchaseLotFormValid({
        ...shared,
        creating: true,
        parsedCost: 0,
      }),
    ).toBe(true)
    expect(
      isPurchaseLotFormValid({
        ...shared,
        creating: true,
        parsedCost: null,
      }),
    ).toBe(false)
    expect(
      isPurchaseLotFormValid({
        ...shared,
        creating: true,
        parsedCost: 100,
        acquiredAt: "",
      }),
    ).toBe(false)
    expect(
      isPurchaseLotFormValid({
        ...shared,
        creating: false,
        parsedCost: null,
        acquiredAt: "",
      }),
    ).toBe(true)
  })

  it("submits zero cost and the selected date when adding a purchase", async () => {
    const hooks = createHookHarness()
    const onAddLot = vi.fn(async () => true)
    const dialogProps = {
      open: true,
      onOpenChange: vi.fn(),
      row,
      hideBalance: false,
      onUpdateItem: vi.fn(async () => true),
      onAddLot,
      onUpdateLot: vi.fn(async () => true),
      onRemoveLot: vi.fn(async () => true),
      onRemoveItem: vi.fn(async () => true),
    }

    vi.resetModules()
    vi.doMock("react", async () => ({
      ...(await vi.importActual<typeof import("react")>("react")),
      useState: hooks.useState,
    }))
    vi.doMock("@/stores/ui-store", () => ({
      useUIStore: (
        selector: (state: { language: "TH"; currency: "JPY" }) => unknown,
      ) => selector({ language: "TH", currency: "JPY" }),
    }))
    vi.doMock("@/components/shared/confirm-dialog", () => ({
      useConfirm: () => vi.fn(async () => true),
    }))
    vi.doMock("@/components/ui/button", () => ({ Button: "button" }))
    vi.doMock("@/components/ui/input", () => ({ Input: "input" }))
    vi.doMock("sonner", () => ({
      toast: { success: vi.fn(), error: vi.fn() },
    }))

    const { PurchaseLotsDialog: IsolatedPurchaseLotsDialog } = await import(
      "./purchase-lots-dialog"
    )
    const render = () => {
      hooks.beginRender()
      const dialog = IsolatedPurchaseLotsDialog(dialogProps)
      const formElement = collectElements(dialog).find(
        (element) =>
          (element.props.editor as { kind?: string } | undefined)?.kind ===
          "new",
      )
      const form =
        formElement && typeof formElement.type === "function"
          ? (
              formElement.type as (props: Record<string, unknown>) => unknown
            )(formElement.props)
          : null
      return { dialog, form }
    }

    let rendered = render()
    const addButton = collectElements(rendered.dialog).find(
      (element) =>
        element.type === "button" &&
        element.props["data-slot"] === "portfolio-purchase-lot-add",
    )
    expect(addButton).toBeDefined()
    ;(addButton?.props.onClick as () => void)()

    rendered = render()
    const inputs = collectElements(rendered.form)
    const costInput = inputs.find(
      (element) => element.props.id === "purchase-lot-cost",
    )
    const dateInput = inputs.find(
      (element) => element.props.id === "purchase-lot-date",
    )
    expect(costInput).toBeDefined()
    expect(dateInput).toBeDefined()
    ;(costInput?.props.onChange as (event: {
      target: { value: string }
    }) => void)({ target: { value: "0" } })
    ;(dateInput?.props.onChange as (event: {
      target: { value: string }
    }) => void)({ target: { value: "2026-07-24" } })

    rendered = render()
    const saveButton = collectElements(rendered.form).find(
      (element) =>
        element.type === "button" &&
        nodeText(element.props.children) === t("TH", "save"),
    )
    expect(saveButton?.props.disabled).toBe(false)
    ;(saveButton?.props.onClick as () => void)()

    await vi.waitFor(() => expect(onAddLot).toHaveBeenCalledOnce())
    expect(onAddLot).toHaveBeenCalledWith(1, {
      quantity: 1,
      unitCostJpy: 0,
      acquiredAt: "2026-07-24",
      note: null,
    })

    vi.doUnmock("react")
    vi.doUnmock("@/stores/ui-store")
    vi.doUnmock("@/components/shared/confirm-dialog")
    vi.doUnmock("@/components/ui/button")
    vi.doUnmock("@/components/ui/input")
    vi.doUnmock("sonner")
    vi.resetModules()
  })

  it("opens an only uncosted purchase directly but keeps multi-lot holdings on the list", () => {
    expect(
      getDirectCostLotId({
        lots: [{ ...row.lots[0], unitCostJpy: null }],
      }),
    ).toBe(10)
    expect(getDirectCostLotId(row)).toBeNull()
  })

  it("treats a selected lot as a direct editor session", () => {
    expect(isDirectPurchaseLotEdit(11)).toBe(true)
    expect(isDirectPurchaseLotEdit(null, true)).toBe(true)
    expect(isDirectPurchaseLotEdit(null)).toBe(false)
    expect(isDirectPurchaseLotEdit(undefined)).toBe(false)
  })

  it("builds a direct compatibility editor from legacy parent fields", () => {
    expect(
      getInitialPurchaseLotEditor(
        {
          lots: [],
          quantity: 2,
          purchasePrice: 0,
        },
        null,
        true,
      ),
    ).toEqual({
      kind: "compatibility",
      lot: {
        quantity: 2,
        unitCostJpy: 0,
        acquiredAt: null,
        note: null,
      },
    })
  })

  it("shows every acquisition separately with quantity, unit cost, date, note, and actions", () => {
    const markup = renderToStaticMarkup(
      <PurchaseLotsList
        row={row}
        lang="TH"
        hideBalance={false}
        busy={false}
        deletingLotId={null}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )

    expect(markup.match(/data-slot="portfolio-purchase-lot-row"/g)).toHaveLength(2)
    expect(markup).toContain(t("TH", "openingBalance"))
    expect(markup).toContain(
      t("TH", "purchaseLotNumber").replace("{number}", "1"),
    )
    expect(markup).toContain("×1")
    expect(markup).toContain("×2")
    expect(markup).toContain(t("TH", "dateNotSpecified"))
    expect(markup).toContain("ของเดิมก่อนแยกรายการ")
    expect(markup).toContain("ซื้อเพิ่มจากร้าน")
    expect(markup.match(/data-slot="portfolio-purchase-lot-cost"/g)).toHaveLength(2)
    expect(markup).toContain(
      `aria-label="${t("TH", "editPurchaseLot")}: Roronoa Zoro · ${t("TH", "openingBalance")}"`,
    )
    expect(markup).toContain(
      `aria-label="${t("TH", "editPurchaseLot")}: Roronoa Zoro · ${t("TH", "purchaseLotNumber").replace("{number}", "1")}"`,
    )
    expect(markup).toContain(
      `aria-label="${t("TH", "deletePurchaseLot")}: Roronoa Zoro · ${t("TH", "openingBalance")}"`,
    )
    expect(markup).toContain(
      `aria-label="${t("TH", "deletePurchaseLot")}: Roronoa Zoro · ${t("TH", "purchaseLotNumber").replace("{number}", "1")}"`,
    )
  })

  it("masks only money while keeping lot structure and notes readable", () => {
    const markup = renderToStaticMarkup(
      <PurchaseLotsList
        row={row}
        lang="TH"
        hideBalance
        busy={false}
        deletingLotId={null}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )

    expect(markup.match(new RegExp(MASKED, "g"))).toHaveLength(2)
    expect(markup).toContain("×1")
    expect(markup).toContain("×2")
    expect(markup).toContain("ซื้อเพิ่มจากร้าน")
  })

  it("shows a clear record-cost action on an uncosted purchase", () => {
    const markup = renderToStaticMarkup(
      <PurchaseLotsList
        row={{
          ...row,
          lots: [{ ...row.lots[0], unitCostJpy: null }],
          lotCount: 1,
          recordedCostJpy: 0,
          costedCopyCount: 0,
        }}
        lang="TH"
        hideBalance={false}
        busy={false}
        deletingLotId={null}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )

    expect(markup).toContain(
      'data-slot="portfolio-purchase-lot-record-cost"',
    )
    expect(markup).toContain(t("TH", "recordCost"))
  })

  it("treats a condition change as an unsaved holding detail", () => {
    expect(
      hasHoldingDetailsChanges(row, {
        condition: "LP",
        notes: null,
        isPrivate: false,
      }),
    ).toBe(true)
    expect(
      hasHoldingDetailsChanges(row, {
        condition: "NM",
        notes: null,
        isPrivate: false,
      }),
    ).toBe(false)
  })

  it.each(["TH", "EN", "JP"] as const)(
    "renders the canonical condition selector with %s copy",
    (lang) => {
      const markup = renderToStaticMarkup(
        <HoldingDetails
          row={row}
          lang={lang}
          busy={false}
          saving={false}
          onSave={vi.fn()}
        />,
      )

      expect(markup).toContain(
        'data-slot="portfolio-holding-condition"',
      )
      expect(markup).toContain('role="radiogroup"')
      expect(markup.match(/role="radio"/g)).toHaveLength(5)
      expect(markup).toContain('aria-checked="true"')
      expect(markup).toContain(t(lang, "mktPriceConditionLabel"))
      expect(markup).toContain(t(lang, "mktPriceConditionNM"))
    },
  )
})

import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import type { PortfolioMeta } from "@/lib/types/portfolio"

import {
  getPortfolioUpgradeTier,
  PortfolioSidebar,
  shouldConfirmPortfolioVisibility,
} from "./portfolio-selector"
import { PortfolioSwitcher } from "./portfolio-switcher"

vi.mock("./portfolio-create-dialog", () => ({
  PortfolioCreateDialog: () => (
    <div data-slot="portfolio-switcher-internal-create-dialog" />
  ),
}))

const complete: PortfolioMeta = {
  id: 1,
  name: "Complete",
  isPublic: false,
  totalValue: 1_000,
  totalCost: 500,
  itemCount: 1,
  copyCount: 1,
  estimatedValueJpy: 1_000,
  recordedCostJpy: 500,
  totalCopyCount: 1,
  valuedCopyCount: 1,
  costedCopyCount: 1,
  valuationComplete: true,
  performanceComplete: true,
  pnlJpy: 500,
  roiPct: 100,
  games: [],
  previewItems: [],
}

const empty: PortfolioMeta = {
  ...complete,
  id: 2,
  name: "Empty",
  totalValue: 0,
  totalCost: 0,
  itemCount: 0,
  copyCount: 0,
  estimatedValueJpy: 0,
  recordedCostJpy: 0,
  totalCopyCount: 0,
  valuedCopyCount: 0,
  costedCopyCount: 0,
  valuationComplete: false,
  performanceComplete: false,
  pnlJpy: null,
  roiPct: null,
}

const createPortfolio = async () => ({
  ok: true as const,
  status: 201,
  error: null,
  data: { id: 3 },
})

const mutationSuccess = async () => ({
  ok: true as const,
  status: 200,
  error: null,
  data: undefined,
})

describe("PortfolioSwitcher", () => {
  it("keeps the active name, privacy, and plan count together in the trigger", () => {
    const markup = renderToStaticMarkup(
      <PortfolioSwitcher
        portfolios={[complete, empty]}
        activeId={complete.id}
        onSelect={() => undefined}
        onCreate={createPortfolio}
        onCreatedPortfolio={() => undefined}
        onRename={mutationSuccess}
        onSetVisibility={mutationSuccess}
        onDelete={mutationSuccess}
        totalAllPortfolios={1_000}
        maxPortfolios={5}
      />,
    )

    expect(markup).toContain("Complete")
    expect(markup).toContain("ส่วนตัว")
    expect(markup).toContain("2/5 พอร์ต")
    expect(markup).toContain(
      'aria-label="สลับพอร์ต: Complete, ส่วนตัว, 2/5 พอร์ต"',
    )
    expect(markup).not.toContain("1,000")
  })

  it("does not mount a duplicate create dialog when creation is lifted", () => {
    const sharedProps = {
      portfolios: [complete, empty],
      activeId: complete.id,
      onSelect: () => undefined,
      onCreate: createPortfolio,
      onCreatedPortfolio: () => undefined,
      onRename: mutationSuccess,
      onSetVisibility: mutationSuccess,
      onDelete: mutationSuccess,
      totalAllPortfolios: 1_000,
    }
    const internal = renderToStaticMarkup(<PortfolioSwitcher {...sharedProps} />)
    const lifted = renderToStaticMarkup(
      <PortfolioSwitcher
        {...sharedProps}
        onCreateRequest={() => undefined}
      />,
    )

    expect(internal).toContain(
      'data-slot="portfolio-switcher-internal-create-dialog"',
    )
    expect(lifted).not.toContain(
      'data-slot="portfolio-switcher-internal-create-dialog"',
    )
  })
})

describe("PortfolioSidebar", () => {
  it("gives every row a separate 44px management menu", () => {
    const markup = renderToStaticMarkup(
      <PortfolioSidebar
        portfolios={[complete, { ...empty, isPublic: true }]}
        activeId={complete.id}
        onSelect={() => undefined}
        onCreateRequest={() => undefined}
        onRename={mutationSuccess}
        onSetVisibility={mutationSuccess}
        onDelete={mutationSuccess}
      />,
    )

    expect(markup).toContain('<button type="button" aria-current="page"')
    expect(markup).toContain("Complete")
    expect(markup).toContain('aria-label="จัดการ Complete"')
    expect(markup).toContain('aria-label="จัดการ Empty"')
    expect(markup.match(/aria-label="จัดการ /g)).toHaveLength(2)
    expect(markup.match(/flex size-11 shrink-0/g)).toHaveLength(2)
    expect(markup).not.toContain('role="button"')
  })

  it("keeps the normal create affordance at the plan limit", () => {
    const markup = renderToStaticMarkup(
      <PortfolioSidebar
        portfolios={[complete]}
        activeId={complete.id}
        onSelect={() => undefined}
        onCreateRequest={() => undefined}
        onRename={mutationSuccess}
        onSetVisibility={mutationSuccess}
        onDelete={mutationSuccess}
        maxPortfolios={1}
      />,
    )

    expect(markup).toContain("สร้างพอร์ตใหม่")
    expect(markup).toContain("border-dashed")
    expect(markup).not.toContain("แผนของคุณสร้างได้สูงสุด")
    expect(markup).not.toContain("อัปเกรดเพื่อเพิ่มพอร์ต")
  })

  it("requires confirmation only when changing a portfolio to public", () => {
    expect(shouldConfirmPortfolioVisibility(true)).toBe(true)
    expect(shouldConfirmPortfolioVisibility(false)).toBe(false)
  })

  it("requests the next paid tier when a capped plan is full", () => {
    expect(getPortfolioUpgradeTier(1)).toBe("PRO")
    expect(getPortfolioUpgradeTier(5)).toBe("PRO_PLUS")
  })
})

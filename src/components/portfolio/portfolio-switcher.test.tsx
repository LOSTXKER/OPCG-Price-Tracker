import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import type { PortfolioMeta } from "@/lib/types/portfolio"

import {
  PortfolioSidebar,
  shouldConfirmPortfolioVisibility,
} from "./portfolio-selector"
import { PortfolioSwitcher } from "./portfolio-switcher"

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
  it("derives the active name and privacy without repeating its value in the trigger", () => {
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
      />,
    )

    expect(markup).toContain("Complete")
    expect(markup).toContain("ส่วนตัว")
    expect(markup).toContain('aria-label="สลับพอร์ต: Complete, ส่วนตัว"')
    expect(markup).not.toContain("1,000")
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

  it("requires confirmation only when changing a portfolio to public", () => {
    expect(shouldConfirmPortfolioVisibility(true)).toBe(true)
    expect(shouldConfirmPortfolioVisibility(false)).toBe(false)
  })
})

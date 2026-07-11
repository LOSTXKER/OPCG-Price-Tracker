import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import {
  getMarketFeedPreview,
  MARKET_FEED_REAL_PREVIEW_COUNT,
  MARKET_FEED_SAMPLE_PREVIEW_COUNT,
} from "./market-table-layout"
import { mockRecentSales } from "./mock"
import { RecentSales } from "./recent-sales"

describe("card-detail market feed previews", () => {
  it("keeps sample and real-listing preview counts separate", () => {
    const rows = Array.from({ length: 8 }, (_, index) => index)

    expect(MARKET_FEED_SAMPLE_PREVIEW_COUNT).toBe(3)
    expect(MARKET_FEED_REAL_PREVIEW_COUNT).toBe(5)
    expect(getMarketFeedPreview(rows, true)).toEqual([0, 1, 2])
    expect(getMarketFeedPreview(rows, false)).toEqual([0, 1, 2, 3, 4])
  })

  it("renders simulated sales as a disclosed, non-interactive short preview", () => {
    const sales = mockRecentSales(
      1_200,
      "2026-07-11T12:00:00.000Z",
      MARKET_FEED_SAMPLE_PREVIEW_COUNT,
    )
    const markup = renderToStaticMarkup(
      <RecentSales sales={sales} isSample currency="THB" lang="TH" />,
    )

    expect(markup).toContain("ตัวอย่างประวัติการซื้อขาย")
    expect(markup).toContain("ไม่ใช่ธุรกรรมจริง")
    expect(markup).toContain('role="note"')
    expect(markup).not.toContain('role="region"')
    expect(markup).not.toContain("overflow-y-auto")
    expect(markup).not.toContain("<a ")
    expect(markup.match(/<tr(?:\s|>)/g)).toHaveLength(4)
  })

  it("keeps a long real-sales feed in page flow behind an expand control", () => {
    const sales = mockRecentSales(1_200, "2026-07-11T12:00:00.000Z", 6)
    const markup = renderToStaticMarkup(
      <RecentSales sales={sales} currency="THB" lang="EN" />,
    )

    expect(markup).not.toContain('role="region"')
    expect(markup).not.toContain("overflow-y-auto")
    expect(markup).toContain('aria-expanded="false"')
    expect(markup).toContain("View all")
    expect(markup.match(/<tr(?:\s|>)/g)).toHaveLength(6)
    expect(markup).not.toContain("not real transactions")
  })
})

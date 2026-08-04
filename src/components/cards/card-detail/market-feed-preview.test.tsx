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

  it("keeps simulated sales disclosed, in one quiet line, and non-interactive", () => {
    const sales = mockRecentSales(
      1_200,
      "2026-07-11T12:00:00.000Z",
      MARKET_FEED_SAMPLE_PREVIEW_COUNT,
    )
    const markup = renderToStaticMarkup(
      <RecentSales sales={sales} isSample currency="THB" lang="TH" />,
    )

    // The owner asked for the loud badge and the boxed callout to go (they
    // dominated the section). The DISCLOSURE itself must survive that cleanup:
    // this block prints invented prices on a public price tracker, so one plain
    // line has to say so. Assert the fact, not the old chrome.
    expect(markup).toContain("ไม่ใช่ธุรกรรมจริง")
    expect(markup).not.toContain('role="note"')
    expect(markup).not.toContain('role="region"')
    expect(markup).not.toContain("<a ")
    expect(markup.match(/<tr(?:\s|>)/g)).toHaveLength(4)
  })

  it("caps a long feed at a scroll box without dropping rows from the HTML", () => {
    const sales = mockRecentSales(1_200, "2026-07-11T12:00:00.000Z", 6)
    const markup = renderToStaticMarkup(
      <RecentSales sales={sales} currency="THB" lang="EN" />,
    )

    // The feed used to expand in page flow to avoid a nested vertical scroll on
    // phones; the owner asked for a ~5-row box that scrolls instead. What must
    // NOT change is that every row still ships in the HTML — the box caps the
    // height, it never slices the data, so a crawler still reads the whole feed.
    expect(markup).toContain("overflow-y-auto")
    // Guards the nested-scroll trap: a flick that bottoms out must not scroll
    // the page underneath.
    expect(markup).toContain("overscroll-contain")
    expect(markup).not.toContain('role="region"')
    expect(markup).toContain('aria-expanded="false"')
    expect(markup).toContain("View all")
    expect(markup.match(/<tr(?:\s|>)/g)).toHaveLength(6)
    expect(markup).not.toContain("not real transactions")
  })
})

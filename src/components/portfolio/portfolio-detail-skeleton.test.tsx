import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { PortfolioDetailSkeleton } from "./portfolio-detail-skeleton"

describe("PortfolioDetailSkeleton", () => {
  it("matches the detail hierarchy without a hub or breadcrumb row", () => {
    const markup = renderToStaticMarkup(<PortfolioDetailSkeleton rows={3} />)

    expect(markup).toContain('data-slot="portfolio-detail-skeleton"')
    expect(markup.match(/data-slot="portfolio-detail-skeleton-row"/g)).toHaveLength(3)
    expect(markup).not.toContain("portfolio-manager-skeleton")
  })
})

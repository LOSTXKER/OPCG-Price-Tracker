import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { t } from "@/lib/i18n"

import { PortfolioMockPreview } from "./portfolio-mock-preview"

describe("PortfolioMockPreview", () => {
  it("shows the detail shape instead of the retired manager", () => {
    const markup = renderToStaticMarkup(<PortfolioMockPreview lang="TH" />)

    expect(markup).toContain('data-slot="portfolio-detail-preview"')
    expect(markup).toContain(t("TH", "myPortfolio"))
    expect(markup).not.toContain('data-slot="portfolio-manager"')
  })
})

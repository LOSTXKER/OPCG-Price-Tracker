import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { PortfolioScrubChart } from "./portfolio-scrub-chart"

describe("PortfolioScrubChart empty range rail", () => {
  it("keeps the rail pannable while disabling every unavailable range", () => {
    const markup = renderToStaticMarkup(<PortfolioScrubChart data={[]} />)

    expect(markup).toContain("overflow-x-auto")
    expect(markup).not.toContain('class="no-sb pointer-events-none')
    expect(markup.match(/role="radio"/g)).toHaveLength(6)
    expect(markup.match(/disabled=""/g)).toHaveLength(6)
    expect(markup.match(/tabindex="-1"/g)).toHaveLength(6)
  })
})

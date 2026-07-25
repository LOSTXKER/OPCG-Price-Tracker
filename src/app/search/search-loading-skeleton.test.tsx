import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import {
  SearchPageSkeleton,
  SearchResultsSkeleton,
} from "./search-loading-skeleton"
import SearchLoading from "./loading"

describe("search loading parity", () => {
  it("keeps the runtime control wrapping and grade rail geometry", () => {
    const markup = renderToStaticMarkup(<SearchLoading />)

    expect(markup).toContain('data-slot="search-bar-skeleton"')
    expect(markup).toContain('data-slot="search-controls-skeleton"')
    expect(markup).toContain("flex-wrap")
    expect(markup).toContain("basis-full")
    expect(markup).toContain("sm:w-[220px]")
    expect(markup).toContain("sm:w-56")
    expect(markup).toContain("h-11 w-full rounded-full lg:h-9")
  })

  it("keeps the shared page skeleton available to the client Suspense boundary", () => {
    const markup = renderToStaticMarkup(<SearchPageSkeleton />)

    expect(markup).toContain('data-slot="search-page-skeleton"')
    expect(markup).toContain('data-slot="search-results-skeleton"')
  })

  it("renders the mobile list and canonical desktop market-table anatomy", () => {
    const markup = renderToStaticMarkup(<SearchResultsSkeleton rows={3} />)

    expect(markup).toContain('data-view="table"')
    expect(markup).toContain('data-slot="search-mobile-list-skeleton"')
    expect(markup).toContain('data-slot="search-desktop-table-skeleton"')
    expect(markup).toContain("sm:hidden")
    expect(markup).toContain("hidden overflow-x-auto sm:block")
    expect(markup).toContain("w-full table-fixed text-left text-sm")
    expect(markup).toContain("bg-background")
    expect(markup).not.toContain("ease-chrome panel")
    expect(markup.match(/min-h-\[52px\]/g)).toHaveLength(3)
    expect(markup.match(/<tr/g)).toHaveLength(4)
  })

  it("uses canonical card-grid placeholders for grid transitions", () => {
    const markup = renderToStaticMarkup(<SearchResultsSkeleton view="grid" />)

    expect(markup).toContain('data-view="grid"')
    expect(markup).toContain("grid-cols-2")
    expect(markup.match(/aspect-\[63\/88\]/g)).toHaveLength(10)
  })
})

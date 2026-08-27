import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

function source(path: string): string {
  const absolute = resolve(process.cwd(), path)
  return existsSync(absolute) ? readFileSync(absolute, "utf8") : ""
}

function occurrences(value: string, needle: string): number {
  return value.split(needle).length - 1
}

/**
 * Owner decision 2026-08-28 (evening): the desktop chrome is BACK to the
 * shipped two-row layout after three redesign rounds were tried and rejected.
 *
 *   Row 1 (ticker, 44px): Game → Set · market figures · search · upgrade ·
 *                         language · currency · theme
 *   Row 2 (header, 56px): wordmark · nav hubs · portfolio/watchlist/honey ·
 *                         account menu
 *
 * These tests lock that restored shape so a later refactor cannot quietly
 * reintroduce a rejected variant. What did NOT come back with it: the phone
 * header's theme toggle (lives on /more since 2026-08-27) and the home
 * market-status panel (a separate, still-approved surface).
 */
describe("restored two-row desktop chrome", () => {
  it("keeps the ticker as row 1 with catalog, figures, search and preferences", () => {
    const header = source("src/components/layout/header.tsx")
    const ticker = source("src/components/layout/header-market-ticker.tsx")

    expect(occurrences(header, "<HeaderMarketTicker")).toBe(1)
    expect(header.indexOf("<HeaderMarketTicker")).toBeLessThan(
      header.indexOf("<header"),
    )

    // The ticker owns the catalog scope, the market figures, the search entry
    // and the three display preferences — one strip, one row of chrome.
    expect(ticker).toContain("<HeaderCatalogControl")
    expect(ticker).toContain('presentation="desktop"')
    expect(ticker).toContain("onSearchOpen")
    for (const figure of ["totalCards", "totalValue", "exchangeRate", "JPY/THB"]) {
      expect(ticker).toContain(figure)
    }
    for (const preference of ["LANG_OPTIONS", "CURRENCY_OPTIONS", "useTheme"]) {
      expect(ticker).toContain(preference)
    }
    expect(ticker).toContain('href={`/${game}/market-overview`}')
  })

  it("keeps the account menu in row 2 and never duplicates it", () => {
    const header = source("src/components/layout/header.tsx")
    const primaryRow = header.indexOf("<header")
    const userMenu = header.indexOf("<HeaderUserMenu")

    expect(primaryRow).toBeGreaterThan(-1)
    expect(userMenu).toBeGreaterThan(primaryRow)
    expect(occurrences(header, "<HeaderUserMenu")).toBe(1)
    // The rejected rounds moved these into row 1 / a tab strip. They belong to
    // row 2's right-hand cluster.
    expect(header).toContain('href="/portfolio"')
    expect(header).toContain('href="/watchlist"')
    expect(header).toContain('href="/honey"')
  })

  it("fetches the market figures once, in the header data hook", () => {
    const headerData = source("src/hooks/use-header-data.ts")
    const ticker = source("src/components/layout/header-market-ticker.tsx")

    expect(headerData).toContain("/api/exchange-rate")
    expect(headerData).toContain("/api/cards?limit=1")
    // The strip renders what the hook resolved; it must not open its own
    // request path (that was the rejected round's shape).
    expect(ticker).not.toContain("apiGet")
    expect(ticker).toContain("stats.totalCards")
  })

  it("keeps both keyboard shortcuts and restores focus after Escape", () => {
    const header = source("src/components/layout/header.tsx")
    const search = source("src/components/shared/command-search.tsx")

    expect(header).toContain('(e.metaKey || e.ctrlKey) && e.key === "k"')
    expect(header).toContain('e.key === "/"')
    expect(header).toContain('["INPUT", "TEXTAREA", "SELECT"]')
    expect(search).toContain("restoreFocusRef")
    expect(search).toContain("finalFocus={restoreFocusRef}")
  })

  it("keeps the phone header's own search entry and its /more preferences", () => {
    const mobile = source("src/components/layout/header-mobile.tsx")
    const more = source("src/app/more/more-client.tsx")

    expect(occurrences(mobile, "data-mobile-search-trigger")).toBe(1)
    expect(mobile).toContain("surface-2 hairline")
    // Phone chrome is untouched by the desktop revert: its theme toggle still
    // lives on /more, not in the row.
    expect(mobile).not.toContain("useTheme()")
    expect(more).toContain("setLanguage(")
    expect(more).toContain("setCurrency(")
    expect(more).toContain("setTheme(")
    expect(more).toContain("THEME_OPTIONS")
  })

  it("keeps set and photo search inside the command palette", () => {
    const header = source("src/components/layout/header.tsx")
    const search = source("src/components/shared/command-search.tsx")

    // Invisible in the bar, but the palette needs the catalog to answer set
    // queries — the revert must not drop the wiring.
    //
    // Scope this to the CommandSearchModal element on purpose. `sets={headerSets.sets}`
    // also appears on HeaderMarketTicker and HeaderMobile, where the prop is
    // TYPE-REQUIRED and so can never silently disappear. Here it is optional
    // (`sets = []` in command-search.tsx), which means dropping it fails no
    // gate — not tsc, not lint — and just empties set results at runtime. A
    // bare `toContain` would stay green on the two decoys and guard nothing.
    const modalStart = header.indexOf("<CommandSearchModal")
    expect(modalStart).toBeGreaterThan(-1)
    const modalElement = header.slice(modalStart, header.indexOf("/>", modalStart))
    expect(modalElement).toContain("sets={headerSets.sets}")

    expect(search).toContain("<PhotoSearchButton")
    expect(search).toContain("data-command-photo-search")
    expect(search).toContain("setMatches.map")
    expect(search).toContain("/opcg/sets/${set.code}")
  })
})

describe("home search dedupe", () => {
  it("mounts the compact home intro once and never remounts HeroSearchBar", () => {
    const page = source("src/app/page.tsx")

    expect(occurrences(page, "<HomeSearchHero />")).toBe(1)
    expect(page).not.toContain("<HeroSearchBar")
  })

  it("keeps market status to one desktop track and reserves the fourth xl track for ads", () => {
    const page = source("src/app/page.tsx")

    expect(page).toContain("lg:grid-cols-3 xl:grid-cols-4")
    expect(page).toContain('className="sm:col-span-2 lg:col-span-1"')
    expect(page).toContain('data-slot="home-highlight-grid"')
  })
})

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
 * Owner decisions 2026-08-28 (evening), in order:
 *  1. the desktop chrome went BACK to the shipped two-row layout after three
 *     redesign rounds were tried and rejected;
 *  2. search and the account cluster SWAPPED rows;
 *  3. then, following CoinGecko / CoinMarketCap: the brand moved up into the
 *     strip, language + currency + theme moved OFF the bar and into the account
 *     menu (with a gear for guests), and search became a real field wide enough
 *     to be the page's only way in — the home hero no longer has an input;
 *  4. later that evening the owner picked "navbar แบบ C" from the /proto/navbar
 *     comparison: the market figures moved onto a thin ticker strip of their
 *     own (plain text, never chips, no green on chrome), and the search field
 *     moved to the FAR RIGHT of the nav row, after Honey.
 *
 *   Strip (28px):  market figures · "อัปเดตล่าสุด"
 *   Row 1 (44px):  brand · Game → Set · upgrade ·
 *                  chat/notifications/account-menu (or guest gear)
 *   Row 2 (56px):  nav hubs · portfolio/watchlist/honey · SEARCH FIELD
 *
 * These tests lock that shape so a later refactor cannot quietly reintroduce a
 * rejected variant. What did NOT move: the phone header keeps its own search
 * trigger and its /more preferences.
 */
describe("two-row desktop chrome, CoinGecko-style", () => {
  it("keeps brand, catalog, figures and account in the strip — and preferences out of it", () => {
    const header = source("src/components/layout/header.tsx")
    const ticker = source("src/components/layout/header-market-ticker.tsx")

    expect(occurrences(header, "<HeaderMarketTicker")).toBe(1)
    expect(header.indexOf("<HeaderMarketTicker")).toBeLessThan(
      header.indexOf("<header"),
    )

    expect(ticker).toContain('aria-label="Meecard"')
    expect(ticker).toContain("<HeaderCatalogControl")
    expect(ticker).toContain('presentation="desktop"')
    for (const figure of ["totalCards", "totalValue", "exchangeRate", "JPY/THB"]) {
      expect(ticker).toContain(figure)
    }
    expect(ticker).toContain('href={`/${game}/market-overview`}')
    // navbar แบบ C: the figures live on their own thin strip as plain text —
    // chips up here read as buttons, and green is reserved for real P/L.
    expect(ticker).toContain('data-slot="ticker-strip"')
    expect(ticker).not.toContain("bg-muted/50")
    expect(ticker).not.toContain("text-price-up")

    // Search and the three display preferences both left this strip.
    expect(ticker).not.toContain("onSearchOpen")
    expect(ticker).not.toContain("<Search")
    for (const preference of ["LANG_OPTIONS", "CURRENCY_OPTIONS", "useTheme"]) {
      expect(ticker).not.toContain(preference)
    }
    expect(ticker).toContain("children")
  })

  it("puts the account menu in row 1 and the search field in row 2, never the reverse", () => {
    const header = source("src/components/layout/header.tsx")
    const primaryRow = header.indexOf("<header")
    const userMenu = header.indexOf("<HeaderUserMenu")
    const searchTrigger = header.indexOf("<CommandSearchTrigger")

    expect(primaryRow).toBeGreaterThan(-1)
    expect(occurrences(header, "<HeaderUserMenu")).toBe(1)
    expect(occurrences(header, "<CommandSearchTrigger")).toBe(1)
    // Account renders inside the ticker element, which opens before <header>.
    expect(userMenu).toBeLessThan(primaryRow)
    // Search renders inside <header>, after it opens.
    expect(searchTrigger).toBeGreaterThan(primaryRow)
    // The brand left row 2 so the search field could have that width.
    expect(header).not.toContain('src="/meecard.png"')
    // The saved-state links stay in row 2 beside search.
    expect(header).toContain('href="/portfolio"')
    expect(header).toContain('href="/watchlist"')
    expect(header).toContain('href="/honey"')
    // navbar แบบ C: search closes the row at its far right, AFTER Honey —
    // the nav reads uninterrupted from the left.
    expect(header.indexOf('href="/honey"')).toBeLessThan(searchTrigger)
  })

  it("reaches language, currency and theme from both the account menu and the guest gear", () => {
    const header = source("src/components/layout/header.tsx")
    const userMenu = source("src/components/layout/header-user-menu.tsx")
    const preferences = source("src/components/layout/header-preferences-menu.tsx")

    // Signed in: inside the account menu.
    expect(userMenu).toContain("<HeaderPreferencesMenuItems")
    // Signed out: the gear, in the guest branch only, exactly once.
    expect(header).toContain("<HeaderGuestPreferencesMenu />")
    expect(occurrences(header, "<HeaderGuestPreferencesMenu />")).toBe(1)
    const guestBranchStart = header.indexOf(") : authLoaded ? (")
    expect(guestBranchStart).toBeGreaterThan(-1)
    expect(
      header.slice(guestBranchStart, header.indexOf(") : null}", guestBranchStart)),
    ).toContain("<HeaderGuestPreferencesMenu />")

    // All three settings live in the one shared component.
    expect(preferences).toContain("setLanguage")
    expect(preferences).toContain("setCurrency")
    expect(preferences).toContain("setTheme")
    // Theme is a visible segmented switch, not a third nested submenu.
    expect(preferences).toContain("<SegmentedControl")
    // The trigger has to look like a menu, not just an avatar.
    expect(userMenu).toContain("<Menu ")
  })

  it("paints search as a field, since the home hero no longer has an input", () => {
    const search = source("src/components/shared/command-search.tsx")
    const hero = source("src/components/home/home-search-hero.tsx")

    // Full-width bordered box with placeholder text and the "/" hint, not an
    // icon-only button a visitor has to recognise.
    expect(search).toContain("md:w-full")
    expect(search).toContain('t(lang, "searchCardsDots")')
    expect(search).toContain("md:inline")
    // The hero must not grow an input back while this is the only entry point.
    expect(hero).not.toContain("<input")
    expect(hero).not.toContain("HeroSearchBar")
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

    // No trailing "/>" — the hero takes props now (counts + the per-language
    // updated-date map); the import line has no "<", so this still counts
    // only JSX mounts.
    expect(occurrences(page, "<HomeSearchHero")).toBe(1)
    expect(page).not.toContain("<HeroSearchBar")
  })

  // Owner call 2026-08-28: the sitewide figures belong to the header ticker
  // ALONE. The home highlight row went back to its three editorial blocks
  // (มูลค่าสูงสุด · ขึ้น · ลง) and gained a fourth xl track for advertising.
  it("keeps the home highlights editorial and gives the fourth xl track to ads", () => {
    const page = source("src/app/page.tsx")

    expect(page).toContain("lg:grid-cols-3 xl:grid-cols-4")
    expect(page).toContain('className="sm:col-span-2 lg:col-span-1"')
    expect(page).toContain('data-slot="home-highlight-grid"')
    expect(page).toContain("<HomeFeaturedCard")

    // Scope the ad checks to the ad cell. `zone="home-highlight-rail"` on its
    // own would also be satisfied by the string sitting anywhere in the file,
    // and the cell without its slot is an empty column nobody notices.
    const adStart = page.indexOf('data-slot="home-highlight-ad"')
    expect(adStart).toBeGreaterThan(-1)
    const adCell = page.slice(adStart, page.indexOf("</div>", adStart))
    expect(adCell).toContain("<AdInventorySlot")
    expect(adCell).toContain('zone="home-highlight-rail"')

    // The metrics panel must not come back here while the ticker carries them —
    // that duplication is exactly what this round removed.
    expect(page).not.toContain("<HomeMarketStatus")
    expect(page).not.toContain("totalValue={")
    expect(page).not.toContain("exchangeRate={")
  })

  it("stops paying for home aggregates nothing renders", () => {
    const homeData = source("src/lib/data/home.ts")

    // The ticker fetches its own figures client-side, so the home page query
    // must not also SUM every card price on each render.
    //
    // Assert on the QUERIES, not on variable names: an adversarial check proved
    // that `not.toContain("totalValueAgg")` passes the moment someone renames
    // the binding, while the expensive aggregate keeps running on every render.
    expect(homeData).not.toContain("prisma.card.aggregate")
    expect(homeData).not.toContain("prisma.exchangeRate")
    expect(homeData).not.toContain("_sum")
  })
})

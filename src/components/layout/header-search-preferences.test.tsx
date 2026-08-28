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
    // chips up here read as buttons.
    expect(ticker).toContain('data-slot="ticker-strip"')
    expect(ticker).not.toContain("bg-muted/50")
    // A catalog total is not a profit, so it must not be painted like one.
    // Scope this to the totalValue link: the strip's OTHER half (the marquee)
    // legitimately carries green and red, so a file-wide `not.toContain` would
    // be the wrong guard — it would pass only until the two live in one file.
    const totalValueStart = ticker.indexOf('t(language, "totalValue")')
    expect(totalValueStart).toBeGreaterThan(-1)
    const totalValueBlock = ticker.slice(
      totalValueStart,
      ticker.indexOf("</Link>", totalValueStart),
    )
    expect(totalValueBlock).not.toContain("text-price-up")
    expect(totalValueBlock).not.toContain("text-price-down")

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
    // One purpose-built endpoint carries the figures AND the movers, so adding
    // the marquee did not add a third request. It replaced `/api/cards?limit=1`,
    // which returned a whole card row to read two aggregates.
    expect(headerData).toContain("/api/cards/ticker")
    expect(headerData).not.toContain("/api/cards?limit=1")
    // The strip renders what the hook resolved; it must not open its own
    // request path (that was the rejected round's shape).
    expect(ticker).not.toContain("apiGet")
    expect(ticker).toContain("stats.totalCards")
  })

  // Owner call 2026-08-28 (late): the strip gained colour, more data and
  // motion — the movers marquee. These lock the parts that are easy to break
  // silently: the colour rule, the seamless loop, and the motion opt-outs.
  it("scrolls real movers with arrows, a cloned run, and motion opt-outs", () => {
    const ticker = source("src/components/layout/header-market-ticker.tsx")
    const marquee = source("src/components/layout/header-ticker-marquee.tsx")
    const globals = source("src/app/globals.css")

    expect(ticker).toContain("<HeaderTickerMarquee")
    expect(marquee).toContain('data-slot="ticker-marquee"')

    // Real per-card deltas earn green/red — but colour is never the only
    // signal, so each one ships with its arrow (VISION §4 rule 3).
    for (const token of ["text-price-up", "text-price-down", "ArrowUp", "ArrowDown"]) {
      expect(marquee).toContain(token)
    }

    // Reader-facing codes drop the scraper's printing suffix; the href keeps it.
    expect(marquee).toContain("baseCardCode(mover.cardCode)")
    expect(marquee).toContain("href={`/opcg/cards/${mover.cardCode}`}")

    // Owner request: a small card thumbnail rides along. It must stay
    // decorative (the card is already named beside it) and load eagerly —
    // a transform-driven rail never retriggers the lazy observer.
    expect(marquee).toContain("<Image")
    expect(marquee).toContain('alt=""')
    expect(marquee).toContain('loading="eager"')
    expect(marquee).toContain("mover.imageUrl &&")

    // The -50% keyframe only loops seamlessly against a duplicated run, and the
    // clone must be hidden from assistive tech so cards are announced once.
    expect(marquee).toContain("animate-ticker")
    expect(marquee).toContain("aria-hidden")
    expect(marquee.match(/\{items\}/g)?.length).toBe(2)
    // No data must leave no empty rail behind.
    expect(marquee).toContain("movers.length === 0")

    // Motion opt-outs: hover and keyboard focus pause it, and reduced-motion
    // turns the rail into a plain scroller instead of hiding the cards.
    expect(globals).toContain(".animate-ticker:hover")
    expect(globals).toContain(".ticker-viewport:focus-within .animate-ticker")
    expect(globals).toContain("@media (prefers-reduced-motion: reduce)")
    const reduced = globals.slice(globals.indexOf(".animate-ticker {\n    animation: none;"))
    expect(reduced).toContain("overflow-x: auto")
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

  // Owner selection 2026-08-29 (from /proto/mobile-home): on phones search is
  // the raised button in the middle of the bottom nav, and the header slot it
  // used to occupy now carries รายการโปรด — the tab that stepped aside for it.
  // Exactly ONE phone search entry either way.
  it("puts the phone's search entry in the bottom nav and watchlist in the header", () => {
    const mobile = source("src/components/layout/header-mobile.tsx")
    const nav = source("src/components/layout/bottom-nav.tsx")
    const more = source("src/app/more/more-client.tsx")

    expect(mobile).not.toContain("data-mobile-search-trigger")
    expect(occurrences(mobile, "data-mobile-watchlist-trigger")).toBe(1)
    expect(mobile).toContain('href="/watchlist"')

    // The bottom-nav button opens the modal in place — it must not become a
    // route, or the raised control would take the reader off their page.
    expect(occurrences(nav, "setSearchOpen(true)")).toBe(1)
    expect(nav).toContain('aria-haspopup="dialog"')
    expect(nav).not.toContain('href="/watchlist"')

    expect(mobile).toContain("surface-2 hairline")
    // Phone chrome is untouched by the desktop revert: its theme toggle still
    // lives on /more, not in the row.
    expect(mobile).not.toContain("useTheme()")
    expect(more).toContain("setLanguage(")
    expect(more).toContain("setCurrency(")
    expect(more).toContain("setTheme(")
    expect(more).toContain("THEME_OPTIONS")
  })

  // Owner direction 2026-08-28 (after navbar แบบ C): the search popup follows
  // CoinMarketCap — BEFORE the visitor types it is a discovery surface (recent
  // searches → most-viewed chip rail → 24h movers with real deltas → page
  // shortcuts as pills), and the first keystroke swaps all of it for results.
  it("opens on discovery content, CoinMarketCap-style, before the visitor types", () => {
    const search = source("src/components/shared/command-search.tsx")
    const hook = source("src/hooks/use-search-spotlight.ts")

    // Discovery data rides its own lazy endpoint: fetched when the palette
    // first opens, cached for the page's life — never a page-load cost.
    expect(search).toContain("useSearchSpotlight(open)")
    expect(hook).toContain("/api/cards/spotlight")
    expect(hook).toContain("let cached")

    // Both sections live in the shared keyboard order, and only in the empty
    // state — `isEmptyQuery` is the single switch between the two modes.
    expect(search).toContain("isEmptyQuery")
    for (const token of ['"spot-popular"', '"spot-mover"'] ) {
      expect(occurrences(search, token)).toBeGreaterThanOrEqual(2)
    }

    // Movers carry REAL per-card deltas, so they earn green/red — always
    // paired with an arrow (VISION §4 rule 3), same contract as the marquee.
    for (const token of ["text-price-up", "text-price-down", "ArrowUp", "ArrowDown"]) {
      expect(search).toContain(token)
    }

    // The movers section bridges to the full trending page.
    expect(search).toContain('goToPage("/opcg/trending")')

    // Page shortcuts stay complete (IA-NAV-04's guarantee) but shrink to
    // pills in the empty state so discovery keeps the vertical room.
    expect(search).toContain("rounded-full px-3 text-xs")
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

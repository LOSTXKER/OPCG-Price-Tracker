import { describe, expect, it } from "vitest"

import {
  isAdPageContentReady,
  resolveAdAudience,
} from "./ad-audience-provider"
import { shouldRenderAdSlot } from "./ad-inventory-slot"
import {
  DIRECT_INVENTORY,
  resolveAdProvider,
  type DirectCampaign,
} from "./direct-campaigns"
import {
  AD_INVENTORY,
  AD_ZONES,
  getAdRoute,
  getEligibleAdInventory,
  hasAdInventoryForPath,
  isAdDeniedPath,
  normalizeAdPathname,
} from "./inventory"

const ACTIVE_CAMPAIGN = {
  advertiser: "Test Card Shop",
  headline: {
    TH: "แคมเปญทดสอบ",
    EN: "Test campaign",
    JP: "テストキャンペーン",
  },
  body: {
    TH: "รายละเอียดทดสอบ",
    EN: "Test details",
    JP: "テスト詳細",
  },
  cta: {
    TH: "ดูรายละเอียด",
    EN: "Learn more",
    JP: "詳細を見る",
  },
  href: "https://example.com/campaign",
} satisfies DirectCampaign

describe("advertising route inventory", () => {
  it.each([
    ["/", "HOME"],
    ["/opcg", "HOME"],
    ["/opcg/", "HOME"],
    ["/search", "SEARCH"],
    ["/all/search", "SEARCH"],
    ["/opcg/sets/op-01", "SET_DETAIL"],
    ["/sets/op-01/", "SET_DETAIL"],
    ["/opcg/cards/OP01-001", "CARD_DETAIL"],
  ] as const)("maps %s to %s", (pathname, route) => {
    expect(getAdRoute(pathname)).toBe(route)
  })

  it.each([
    "/sets",
    "/sets/op-01/extra",
    "/cards",
    "/cards/OP01-001/edit",
    "/blog",
    "/about",
  ])("does not broaden P0 inventory to %s", (pathname) => {
    expect(getAdRoute(pathname)).toBeNull()
    expect(hasAdInventoryForPath(pathname)).toBe(false)
  })

  it.each([
    "/pricing",
    "/login",
    "/settings",
    "/settings/subscription",
    "/admin/cards",
    "/seller/orders",
    "/messages/123",
    "/orders/123",
    "/marketplace/create",
    "/proto/ad-preview",
  ])("hard-denies %s", (pathname) => {
    expect(isAdDeniedPath(pathname)).toBe(true)
    expect(getAdRoute(pathname)).toBeNull()
  })

  it("normalizes game prefixes and trailing slashes", () => {
    expect(normalizeAdPathname("/opcg/cards/OP01-001/")).toBe(
      "/cards/OP01-001",
    )
    expect(normalizeAdPathname("/all/search/")).toBe("/search")
  })

  it("keeps every zone explicit and route-bound", () => {
    expect(Object.keys(AD_INVENTORY).sort()).toEqual([...AD_ZONES].sort())

    for (const pathname of [
      "/opcg",
      "/opcg/search",
      "/opcg/sets/OP04",
      "/opcg/cards/OP01-001",
    ]) {
      expect(
        getEligibleAdInventory("global-bottom-anchor", pathname),
      ).toMatchObject({
        strategy: "DIRECT_THEN_GOOGLE",
        format: "ANCHOR",
        route: "GLOBAL",
      })
    }

    expect(
      getEligibleAdInventory("global-bottom-anchor", "/about"),
    ).toBeNull()
    expect(
      getEligibleAdInventory(
        "search-results-after-8",
        "/opcg/search",
      ),
    ).toMatchObject({
      strategy: "GOOGLE_ONLY",
      format: "LEADERBOARD",
    })
    expect(
      getEligibleAdInventory(
        "set-detail-before-rarity",
        "/opcg/sets/OP04",
      ),
    ).toMatchObject({
      strategy: "GOOGLE_ONLY",
      format: "LEADERBOARD",
    })
    expect(
      getEligibleAdInventory(
        "card-detail-chart-rail",
        "/opcg/cards/OP01-001",
      ),
    ).toMatchObject({
      strategy: "DIRECT_THEN_GOOGLE",
      format: "RECTANGLE",
      route: "CARD_DETAIL",
    })
    expect(
      getEligibleAdInventory(
        "card-detail-marketplace-rail",
        "/opcg/cards/OP01-001",
      ),
    ).toMatchObject({
      strategy: "GOOGLE_ONLY",
      format: "RECTANGLE",
      route: "CARD_DETAIL",
    })
    expect(
      getEligibleAdInventory("home-results-after-8", "/opcg/search"),
    ).toBeNull()
    expect(AD_ZONES.join("|")).not.toContain("home-after-hero")
    expect(AD_ZONES.join("|")).not.toContain("set-detail-after-hero")
    expect(AD_ZONES.join("|")).not.toContain("card-detail-after-sales")
    expect(AD_ZONES.join("|")).not.toContain("after-pagination")
    expect(AD_ZONES.join("|")).not.toContain("before-related")
    expect(AD_ZONES.join("|")).not.toContain("search-after-toolbar")
  })

  it("uses provider-neutral zone IDs", () => {
    for (const zone of AD_ZONES) {
      expect(zone).not.toMatch(/(^|-)(direct|google)(-|$)/i)
    }
  })

  it("keeps two sponsor-replaceable slots and four contextual Google-only zones", () => {
    const replaceable = Object.values(AD_INVENTORY).filter(
      (definition) => definition.strategy === "DIRECT_THEN_GOOGLE",
    )
    const googleOnly = Object.values(AD_INVENTORY).filter(
      (definition) => definition.strategy === "GOOGLE_ONLY",
    )

    expect(replaceable.map(({ zone }) => zone)).toEqual([
      "global-bottom-anchor",
      "card-detail-chart-rail",
    ])
    expect(googleOnly).toHaveLength(4)
  })

  it("defaults every replaceable slot to Google until a real Direct campaign is active", () => {
    const activeDirect = {
      status: "ACTIVE",
      campaign: ACTIVE_CAMPAIGN,
    } as const

    expect(DIRECT_INVENTORY).toEqual({})
    for (const zone of [
      "global-bottom-anchor",
      "card-detail-chart-rail",
    ] as const) {
      const definition = AD_INVENTORY[zone]
      expect(resolveAdProvider(definition, undefined)).toBe("GOOGLE_MOCK")
      expect(resolveAdProvider(definition, activeDirect)).toBe("DIRECT")
    }
  })

  it("does not let a Direct campaign replace a Google-only slot", () => {
    expect(
      resolveAdProvider(AD_INVENTORY["home-results-after-8"], {
        status: "ACTIVE",
        campaign: ACTIVE_CAMPAIGN,
      }),
    ).toBe("GOOGLE_MOCK")
  })
})

describe("advertising audience policy", () => {
  it.each([
    {
      name: "unresolved auth",
      input: {
        routeHasInventory: true,
        authed: null,
        authError: null,
      },
      expected: "PENDING",
    },
    {
      name: "auth error",
      input: {
        routeHasInventory: true,
        authed: null,
        authError: "offline",
      },
      expected: "PENDING",
    },
    {
      name: "anonymous visitor",
      input: {
        routeHasInventory: true,
        authed: false,
        authError: null,
      },
      expected: "VISIBLE",
    },
    {
      name: "signed-in tier pending",
      input: {
        routeHasInventory: true,
        authed: true,
        authError: null,
        tierLoaded: false,
      },
      expected: "PENDING",
    },
    {
      name: "free member",
      input: {
        routeHasInventory: true,
        authed: true,
        authError: null,
        tierLoaded: true,
        adFree: false,
      },
      expected: "VISIBLE",
    },
    {
      name: "ad-free member",
      input: {
        routeHasInventory: true,
        authed: true,
        authError: null,
        tierLoaded: true,
        adFree: true,
      },
      expected: "HIDDEN",
    },
    {
      name: "route without inventory",
      input: {
        routeHasInventory: false,
        authed: false,
        authError: null,
      },
      expected: "HIDDEN",
    },
  ] as const)("$name resolves to $expected", ({ input, expected }) => {
    expect(resolveAdAudience(input)).toBe(expected)
  })

  it("collapses paid, loading, error, and empty content states", () => {
    expect(shouldRenderAdSlot("HIDDEN", true)).toBe(false)
    expect(shouldRenderAdSlot("PENDING", true)).toBe(false)
    expect(shouldRenderAdSlot("VISIBLE", false)).toBe(false)
    expect(shouldRenderAdSlot("VISIBLE", true)).toBe(true)
  })

  it("treats content as ready only for the exact active pathname", () => {
    expect(isAdPageContentReady(null, "/opcg")).toBe(false)
    expect(isAdPageContentReady("/opcg", "/opcg/search")).toBe(false)
    expect(isAdPageContentReady("/opcg/search", "/opcg/search")).toBe(true)
  })
})

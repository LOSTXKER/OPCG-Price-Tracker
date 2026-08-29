import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

import type { SetPickerItem } from "@/components/shared/set-picker"

import {
  buildHeaderSetSections,
  compareHeaderSetsNewestFirst,
  getHeaderSetCode,
  getHeaderSetDisplayName,
  getHeaderSetHref,
  resolveHeaderGame,
} from "./header-catalog-control"

function makeSet(
  code: string,
  overrides: Partial<SetPickerItem> = {},
): SetPickerItem {
  return {
    code,
    name: `日本語 ${code}`,
    nameEn: `English ${code}`,
    nameTh: `ภาษาไทย ${code}`,
    type: "BOOSTER",
    ...overrides,
  }
}

describe("header catalog helpers", () => {
  it("groups all 51 sets under real categories exactly once", () => {
    const sets = Array.from({ length: 51 }, (_, index) => {
      const number = index + 1
      return makeSet(`OP${String(number).padStart(2, "0")}`, {
        type:
          number % 3 === 0
            ? "EXTRA_BOOSTER"
            : number % 3 === 1
              ? "BOOSTER"
              : "STARTER_DECK",
        releaseDate: new Date(Date.UTC(2026, 0, number)).toISOString(),
      })
    }).reverse()

    const sections = buildHeaderSetSections(sets, "")
    const flattened = sections.flatMap((section) => section.items)

    expect(sections.map((section) => section.kind)).toEqual([
      "booster",
      "extra",
      "other",
    ])
    expect(sections.map((section) => section.items[0]?.code)).toEqual([
      "OP49",
      "OP51",
      "OP50",
    ])
    expect(flattened).toHaveLength(51)
    expect(new Set(flattened.map((set) => set.code)).size).toBe(51)
  })

  it("sorts dated sets first, then falls back to natural descending codes", () => {
    const sets = [
      makeSet("OP9"),
      makeSet("OP15"),
      makeSet("OP01", { releaseDate: "2026-08-01" }),
      makeSet("OP02", { releaseDate: "2026-08-20" }),
    ]

    expect([...sets].sort(compareHeaderSetsNewestFirst).map((set) => set.code))
      .toEqual(["OP02", "OP01", "OP15", "OP9"])
  })

  it("prioritizes booster lines before starters when release dates are absent", () => {
    const sets = [
      makeSet("ST29", { type: "STARTER" }),
      makeSet("PRB02", { type: "PROMO" }),
      makeSet("EB04", { type: "EXTRA_BOOSTER" }),
      makeSet("OP15", { type: "BOOSTER" }),
    ]

    expect([...sets].sort(compareHeaderSetsNewestFirst).map((set) => set.code))
      .toEqual(["OP15", "EB04", "PRB02", "ST29"])
  })

  it("searches code plus Japanese, English, and Thai names", () => {
    const sets = [
      makeSet("OP03", {
        name: "強大な敵",
        nameEn: "Mighty Enemies",
        nameTh: "ศัตรูผู้แข็งแกร่ง",
      }),
      makeSet("EB02", {
        name: "二つの伝説",
        nameEn: "Two Legends",
        nameTh: "สองตำนาน",
      }),
    ]

    for (const query of ["op03", "強大", "MIGHTY", "แข็งแกร่ง"]) {
      expect(buildHeaderSetSections(sets, query)[0]?.items.map((set) => set.code))
        .toEqual(["OP03"])
    }
  })

  it("keeps exact route codes and resolves the active game scope", () => {
    expect(getHeaderSetHref("opcg", "ST 01/JP")).toBe(
      "/opcg/sets/ST%2001%2FJP",
    )
    expect(getHeaderSetCode("/opcg/sets/ST%2001%2FJP")).toBe("ST 01/JP")
    expect(getHeaderSetCode("/opcg/cards/OP03-001")).toBeNull()
    expect(resolveHeaderGame("/opcg/sets/OP03", "pokemon")).toBe("opcg")
    expect(resolveHeaderGame("/settings", "pokemon")).toBe("opcg")
  })

  it("falls back from blank localized names without losing long names", () => {
    const set = makeSet("OP15", {
      name: "神の島のとても長い冒険名",
      nameEn: "Adventure on KAMI's Island with a deliberately long title",
      nameTh: "",
    })

    expect(getHeaderSetDisplayName(set, "TH")).toBe(set.nameEn)
    expect(getHeaderSetDisplayName(set, "EN")).toBe(set.nameEn)
    expect(getHeaderSetDisplayName(set, "JP")).toBe(set.name)
  })

})

describe("header catalog topology", () => {
  it("keeps one 56px mobile row while desktop chrome is 104px", () => {
    const header = readFileSync(
      resolve(process.cwd(), "src/components/layout/header.tsx"),
      "utf8",
    )
    const desktop = readFileSync(
      resolve(process.cwd(), "src/components/layout/header-market-ticker.tsx"),
      "utf8",
    )
    const mobile = readFileSync(
      resolve(process.cwd(), "src/components/layout/header-mobile.tsx"),
      "utf8",
    )
    const notificationBell = readFileSync(
      resolve(process.cwd(), "src/components/layout/notification-bell.tsx"),
      "utf8",
    )
    const catalog = readFileSync(
      resolve(
        process.cwd(),
        "src/components/layout/header-catalog-control.tsx",
      ),
      "utf8",
    )
    const more = readFileSync(
      resolve(process.cwd(), "src/app/more/more-client.tsx"),
      "utf8",
    )
    const globals = readFileSync(
      resolve(process.cwd(), "src/app/globals.css"),
      "utf8",
    )
    const setDetail = readFileSync(
      resolve(process.cwd(), "src/components/sets/set-detail-content.tsx"),
      "utf8",
    )

    expect(header).not.toContain("<GameSwitcher")
    // navbar D2 (owner call 2026-08-29): the ticker strip and the old brand row
    // folded into ONE 48px row, so this file no longer carries an h-11 row.
    expect(desktop).toContain('className="hairline-b flex h-12')
    expect(desktop).not.toContain('className="flex h-11')
    expect(desktop).toContain('presentation="desktop"')
    // Owner selection 2026-08-29: the phone chrome is TWO rows — identity and
    // account on top, the game→set context bar under it, so the set control
    // finally gets the width its names need (~123px → full row).
    expect(mobile).toContain('data-mobile-header-row="primary"')
    expect(mobile).toContain('data-mobile-header-row="context"')
    expect(mobile.match(/data-mobile-header-row=/g)).toHaveLength(2)
    expect(mobile).toContain('className="flex h-14 min-w-0')
    expect(mobile).toContain('className="flex h-12 min-w-0 items-center bg-muted/30')
    expect(mobile).toContain("px-2 sm:px-4")
    expect(mobile).toContain('presentation="mobile"')
    // Owner call 2026-08-30: row 1's left is the WORDMARK, not the page name —
    // bear and word share ONE link home (two adjacent controls going to the
    // same place is a miss waiting to happen), and the page-name resolver is
    // gone rather than left dangling.
    expect(mobile).toContain(
      '<span className="text-h5 min-w-0 truncate text-foreground">Meecard</span>',
    )
    expect(mobile).not.toContain("resolvePageTitle")
    expect(mobile).toContain(
      'className="flex size-11 shrink-0 items-center justify-center"',
    )
    expect(mobile).toContain(
      'className="h-auto w-7 shrink-0 select-none min-[360px]:w-8"',
    )
    expect(mobile).not.toContain("min-[375px]:inline")
    expect(mobile).not.toContain("min-[480px]:inline")
    expect(mobile).not.toContain('{!isHome && (')
    expect(mobile).not.toContain("const isHome")
    // Owner selection 2026-08-29: search left this row for the raised button
    // in the bottom nav, and รายการโปรด took the slot it vacated — same
    // geometry, one tap, and only ONE search entry on the phone.
    expect(mobile).not.toContain("setSearchOpen(true)")
    expect(mobile).not.toContain('<Search className="size-[18px]" />')
    expect(mobile).toContain('<Heart className="size-[18px]" />')
    // Owner call 2026-08-30 ("จัดดีๆ"): the three tool buttons wear ONE shape,
    // declared once. The bell used to be a bare glyph between two pills, which
    // is what made the row look unfinished — assert it can't drift back.
    expect(mobile).toContain(
      'const TOOL_BUTTON = "surface-2 hairline min-h-11 min-w-11 rounded-full"',
    )
    expect(mobile).toContain(
      "{isAuthenticated && <NotificationBell className={TOOL_BUTTON} />}",
    )
    // The install button matches that geometry but carries the brand tint —
    // owner, 2026-08-30: a one-time invitation that looks exactly like the
    // permanent tools beside it reads as furniture and doesn't get tapped.
    expect(mobile).toContain("<InstallHeaderButton />")
    // Owner decision 2026-08-27: the phone row's theme toggle moved to
    // "ดูเพิ่มเติม" so the set control could keep the width its name needs.
    // The desktop navbar revert (2026-08-28) does NOT undo that — the phone
    // header is not part of the restored desktop chrome — so assert the
    // control stayed reachable on /more instead of in this row.
    expect(mobile).not.toContain("useTheme()")
    expect(more).toContain("setTheme(")
    // Signing in is spelled out now that row 1 has the width; sign-out and
    // profile live behind the account button, which goes to "ดูเพิ่มเติม".
    expect(mobile).toContain('<LogIn className="size-4" />')
    expect(mobile).toContain('data-mobile-account-trigger')
    expect(mobile).toContain('href="/more"')
    expect(notificationBell).toContain(
      '<Bell className="size-[18px] md:size-4" />',
    )
    expect(mobile).not.toContain('!isHome && "hidden sm:block"')
    expect(mobile).not.toContain("hidden shrink-0 px-2 sm:inline-flex")
    expect(mobile).not.toContain('<span className="sr-only">Meecard</span>')
    expect(desktop).toContain('href={`/${game}/market-overview`}')
    expect(catalog).toContain('appearance="standalone"')
    expect(catalog).toContain(
      'compactOnNarrow={presentation === "mobile"}',
    )
    expect(catalog).toContain(
      '? "min-[360px]:px-2.5"',
    )
    expect(catalog).not.toContain(
      'appearance={presentation === "mobile" ? "context" : "standalone"}',
    )
    expect(catalog).not.toContain("[&>svg:last-child]:hidden")
    expect(catalog).not.toContain(
      '"surface-2 hairline min-w-0 flex-1 rounded-xl"',
    )
    expect(catalog).not.toContain("HeaderSpotlightArtwork")
    expect(catalog).not.toContain("resolveHeaderSpotlightSet")
    expect(catalog).toContain("surface-2 hairline ease-chrome")
    // Owner selection 2026-08-29: on its own row the trigger drops the
    // max-width cap and the truncating short-label pair, and shows the set's
    // box art with its code above its FULL name.
    expect(catalog).toContain('"h-9 min-w-11 flex-1"')
    // …and the start padding follows what sits there. Box art is a solid
    // block that may hug the edge; a bare icon on a full-radius pill may not,
    // because the curve has already eaten the corner (เบส, 2026-08-29:
    // "ไอคอน ข้อความรู้สึกติดขอบไป").
    expect(catalog).toContain('selectedSet ? "ps-1.5 pe-2.5" : "ps-3 pe-3"')
    expect(catalog).toContain(
      'selectedSet\n                ? "ps-2.5 pe-2.5 lg:ps-1 lg:pe-2.5"\n                : "ps-3.5 pe-3.5 lg:ps-3 lg:pe-3"',
    )
    // The icon takes its inset from the button, never from its own margin —
    // two sources for one gap is how the 10px imbalance got in.
    expect(catalog).not.toContain('className="ms-1 size-4 shrink-0')
    expect(catalog).not.toContain("min-[480px]:max-w-56")
    expect(catalog).not.toContain("compactTriggerLabel")
    expect(catalog).not.toContain('className="min-[430px]:hidden"')
    expect(catalog).toContain('<SetArtwork set={selectedSet} size="trigger" />')
    expect(catalog).toContain("{selectedSet.code.toUpperCase()}")
    expect(catalog).toContain("{selectedName}")
    expect(catalog).toContain(
      'presentation === "mobile" && "min-w-0 flex-1 gap-1"',
    )
    expect(catalog).toContain("{triggerLabel}")
    expect(catalog).toContain("aria-label={triggerLabel}")
    expect(catalog).toContain('<ChevronRight')
    expect(catalog).toContain("min-w-11")
    expect(catalog).toContain("<PackageOpen")
    expect(catalog).not.toContain('kind: "latest"')
    expect(catalog).toContain(
      'className="min-h-0 flex-1 overflow-y-auto overscroll-contain"',
    )
    expect(catalog).toContain("border-b border-hair bg-popover px-3")
    expect(catalog).not.toContain("bg-popover/95")
    expect(catalog).not.toContain("backdrop-blur-sm")
    // Phone chrome = 56px row 1 + 48px context row (owner selection
    // 2026-08-29). Every sticky sub-bar reads this var, so it must track the
    // real header height.
    expect(globals).toContain("--chrome-h: 6.5rem")
    expect(globals).toContain("@media (min-width: 768px)")
    // navbar D2 (owner call 2026-08-29): merged strip 48px + nav row 56px
    // = 104px of desktop chrome, down from 132px.
    expect(globals).toContain("--chrome-h: 6.5rem")
    expect(setDetail).toContain(
      'parseFloat(styles.getPropertyValue("--chrome-h")) || 3.5',
    )
  })

  it("keeps the default Enter target mounted after search results change", () => {
    const catalog = readFileSync(
      resolve(
        process.cwd(),
        "src/components/layout/header-catalog-control.tsx",
      ),
      "utf8",
    )

    expect(catalog).toContain("onCommit: () => selectOption(0)")
    expect(catalog).not.toContain("optionRefs.current = []")
  })

  // Owner request 2026-08-28: a card page should show ITS set in the header.
  // The card page publishes the set it was served; the control falls back to
  // that whenever the URL has no `/sets/<code>` of its own.
  it("names the card page's set from the store, never from the card code", () => {
    const catalog = readFileSync(
      resolve(process.cwd(), "src/components/layout/header-catalog-control.tsx"),
      "utf8",
    )
    const publisher = readFileSync(
      resolve(
        process.cwd(),
        "src/components/cards/card-detail/active-set-publisher.tsx",
      ),
      "utf8",
    )
    const cardDetail = readFileSync(
      resolve(process.cwd(), "src/components/cards/card-detail.tsx"),
      "utf8",
    )

    // URL first, published set second — never the other way round, or a card
    // page's leftover set would override the set page you actually opened.
    expect(catalog).toContain(
      "getHeaderSetCode(pathname) ?? publishedSetCode",
    )

    // The set must come from the server's own resolution. Deriving it from the
    // card code is wrong for reprints and promos, which keep their original
    // code inside a different set (measured: 16 of 100 cards).
    expect(cardDetail).toContain("<ActiveSetPublisher setCode={set.code} />")
    expect(publisher).not.toContain("cardCode")
    expect(publisher).not.toContain("split(")

    // And it must clear on the way out, or the control keeps naming a set you
    // have already left.
    expect(publisher).toContain("return () => setActiveSetCode(null)")
  })
})

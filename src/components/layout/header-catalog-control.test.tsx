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
  it("keeps one 56px mobile row while desktop chrome stays 100px", () => {
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
    expect(desktop).toContain('className="flex h-11')
    expect(desktop).toContain('presentation="desktop"')
    expect(mobile).toContain('data-mobile-header-row="primary"')
    expect(mobile.match(/data-mobile-header-row=/g)).toHaveLength(1)
    expect(mobile).not.toContain('data-mobile-header-row="catalog"')
    expect(mobile).toContain('className="flex h-14 min-w-0')
    expect(mobile).toContain("px-2 sm:px-4")
    expect(mobile).toContain('presentation="mobile"')
    expect(mobile).toContain(
      'className="mr-1 flex size-11 shrink-0 items-center justify-center"',
    )
    expect(mobile).toContain(
      'className="h-auto w-7 shrink-0 select-none min-[360px]:w-8"',
    )
    expect(mobile).not.toContain("min-[375px]:inline")
    expect(mobile).not.toContain("min-[480px]:inline")
    expect(mobile).not.toContain('{!isHome && (')
    expect(mobile).not.toContain("const isHome")
    expect(mobile).toContain("setSearchOpen(true)")
    expect(mobile).toContain('<Search className="size-[18px]" />')
    expect(mobile).toContain("{isAuthenticated && <NotificationBell />}")
    // Owner decision 2026-08-27: the phone row's theme toggle moved to
    // "ดูเพิ่มเติม" so the set control could keep the width its name needs.
    // The desktop navbar revert (2026-08-28) does NOT undo that — the phone
    // header is not part of the restored desktop chrome — so assert the
    // control stayed reachable on /more instead of in this row.
    expect(mobile).not.toContain("useTheme()")
    expect(more).toContain("setTheme(")
    expect(mobile).toContain('<LogIn className="size-[18px]" />')
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
    expect(catalog).toContain(
      '? "h-11 min-w-11 flex-1 px-2 min-[480px]:max-w-56"',
    )
    expect(catalog).toContain(
      'presentation === "mobile" && "min-w-0 flex-1 gap-1"',
    )
    expect(catalog).toContain(
      'presentation === "mobile" && "hidden"',
    )
    expect(catalog).toContain(
      'presentation === "mobile" && "hidden min-[360px]:block"',
    )
    expect(catalog).toContain(
      'presentation === "mobile" && "hidden min-[430px]:block"',
    )
    expect(catalog).toContain(
      'selectedSet?.code ?? selectedCode ?? t(language, "selectSetShort")',
    )
    expect(catalog).toContain('className="min-[430px]:hidden"')
    expect(catalog).toContain('className="hidden min-[430px]:inline"')
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
    expect(globals).toContain("--chrome-h: 3.5rem")
    expect(globals).toContain("@media (min-width: 768px)")
    expect(globals).toContain("--chrome-h: 6.25rem")
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
})

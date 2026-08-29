import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const source = (path: string) =>
  readFileSync(join(process.cwd(), path), "utf8")

const occurrences = (haystack: string, needle: string) =>
  haystack.split(needle).length - 1

/**
 * Owner selection 2026-08-29 (from the /proto/mobile-home comparison): the
 * phone home page is the "จัดระเบียบ" layout — one gutter, a three-line hero,
 * and two control rows instead of three. These are the parts a later refactor
 * could silently undo, so they are asserted rather than trusted.
 */
describe("mobile home layout", () => {
  it("keeps one gutter: no block re-pads inside the page container", () => {
    const hero = source("src/components/home/home-search-hero.tsx")
    const overview = source("src/components/home/home-market-overview.tsx")

    // The hero used to carry px-4 INSIDE PageContainer's px-5, so its text
    // started 16px right of the rows below it. Assert the class list itself,
    // not the file — the comment above the div names the old value.
    expect(hero).toContain('<div className="pb-2 pt-2 sm:pb-4 sm:pt-4">')

    // The phone toolbar had the same problem; it now inherits the gutter.
    expect(overview).toContain('<div className="py-3 sm:hidden">')

    // The sticky header bleeds through the gutter and pays it back, so its
    // sort labels land over the price column instead of 24px off (px-3 before).
    expect(overview).toContain("-mx-5 flex items-center gap-2")
    expect(overview).toContain("px-5 py-1.5 backdrop-blur-sm")
  })

  it("collapses the phone controls from three rows to two", () => {
    const overview = source("src/components/home/home-market-overview.tsx")

    // Row 1 (set + filter + view) and the sticky column header are the only
    // two phone control rows: the grade rail moved INTO the sticky header, and
    // the standalone period pill row is gone entirely.
    const phoneToolbar = overview.slice(
      overview.indexOf('<div className="py-3 sm:hidden">'),
      overview.indexOf("Desktop/tablet keeps the established"),
    )
    expect(phoneToolbar).toContain("<SetPicker")
    expect(phoneToolbar).toContain("renderFilterTrigger(true)")
    expect(phoneToolbar).toContain("renderViewControl()")
    expect(phoneToolbar).not.toContain("GradeControl")

    // Exactly one GradeControl on the phone path — the one in the sticky header.
    expect(overview).toContain("<GradeControl value={m.grade}")
    expect(occurrences(overview, "<GradeControl")).toBe(2) // phone sticky + desktop toolbar
    expect(overview).toContain("<MobileSortCluster")
  })

  it("uses the z-index token for the sticky column header", () => {
    const overview = source("src/components/home/home-market-overview.tsx")

    // A bare z-10 here was inert against the chrome; AGENTS.md requires a token
    // on anything sticky.
    expect(overview).toContain("sticky top-[var(--chrome-h)] z-sticky")
    expect(overview).not.toContain("sticky top-[var(--chrome-h)] z-10")
  })

  it("folds the change period into the sort control instead of its own row", () => {
    const cluster = source("src/components/home/mobile-sort-cluster.tsx")

    // The period is a modifier of the % column: the label sorts by the current
    // period's column and the chip cycles the window.
    expect(cluster).toContain("column={PERIOD_COLUMNS[period]}")
    expect(cluster).toContain("CHANGE_PERIODS.indexOf(period)")
    // Graded lenses keep the geometry but drop tap-sort (modeled deltas).
    expect(cluster).toContain("sortEnabled ? (")
    // Touch targets stay at the 44px floor.
    expect(cluster).toContain("min-h-11")
  })

  it("splits the hero lead so the counts stop wrapping to five lines", () => {
    const hero = source("src/components/home/home-search-hero.tsx")
    const copy = source("src/lib/seo/copy/home.ts")

    expect(hero).toContain("buildHomeHeroLead(lang)")
    expect(hero).toContain("buildHomeHeroMeta(lang, {")

    // The H1 keeps the pillar keyword, and neither line may promise a refresh
    // schedule — prices are not scraped on one (SEO copy rule).
    expect(copy).toContain("ราคาการ์ดวันพีชวันนี้")
    expect(copy).toContain("ราคากลาง Raw และ PSA 10 ของการ์ดวันพีช")
    const lead = copy.slice(
      copy.indexOf("export function buildHomeHeroLead"),
      copy.indexOf("export function buildHomeHeroMeta"),
    )
    expect(lead).not.toContain("อัปเดตทุกวัน")
    expect(lead).not.toContain("เรียลไทม์")
    // The freshness signal is a real date, carried by the meta line.
    expect(copy).toContain("อัปเดตล่าสุด ${data.updatedLabel}")
  })

  it("hides the set strip's helper line on phones only", () => {
    const strip = source("src/components/home/home-set-strip.tsx")

    expect(strip).toContain('className="mt-0.5 hidden text-meta sm:block"')
  })
})

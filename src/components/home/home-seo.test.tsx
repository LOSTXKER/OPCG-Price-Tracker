import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

// The hero's search bar calls useRouter; there is no app-router context in a
// plain SSR render.
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: () => undefined,
    replace: () => undefined,
    prefetch: () => undefined,
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}))

// FaqSection pulls in the JSON-LD builders, which validate the public env at
// import time. Vitest runs without a .env, so seed the two required keys before
// the component graph is loaded (hence the dynamic imports below).
process.env.NEXT_PUBLIC_SUPABASE_URL ||= "https://test.supabase.co"
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= "test-anon-key"

const { HomeSearchHero } = await import("./home-search-hero")
const { HomeMarketIntro } = await import("./home-market-intro")
const { HomeSetStrip } = await import("./home-set-strip")
const { HomeSeoContent } = await import("./home-seo-content")

function countTag(markup: string, tag: string): number {
  return markup.split(`<${tag}`).length - 1
}

/**
 * The home page is the site's SEO pillar (doc/seo-content-plan.md §3.1). These
 * assertions pin the three things that regressed before: a keyword-bearing H1
 * that is actually visible, crawlable set links, and FAQ content that exists in
 * the first HTML response instead of appearing after hydration.
 */
describe("home page SEO shell", () => {
  it("puts the target keyword in the H1's own visible text", () => {
    const markup = renderToStaticMarkup(
      <HomeSearchHero sets={[]} trending={[]} />,
    )

    const h1 = markup.slice(markup.indexOf("<h1"), markup.indexOf("</h1>"))

    expect(countTag(markup, "h1")).toBe(1)
    expect(h1).toContain("การ์ดวันพีซ")
    // The keyword must not be hidden from sighted users, and the rotating
    // typewriter must not be the H1's only visible content.
    expect(h1).not.toContain("sr-only")
    expect(h1).not.toContain("aria-hidden")
    expect(h1).not.toContain("tw-caret")
    // ...but the animation is still on the page, one level down.
    expect(markup).toContain("tw-caret")
  })

  it("keeps the supporting blocks at h2 or lower (one H1 per page)", () => {
    const blocks = [
      renderToStaticMarkup(<HomeMarketIntro totalCards={3838} totalSets={51} />),
      renderToStaticMarkup(
        <HomeSetStrip sets={[{ code: "OP01", name: "Romance Dawn" }]} />,
      ),
      renderToStaticMarkup(<HomeSeoContent />),
    ]

    for (const markup of blocks) expect(countTag(markup, "h1")).toBe(0)
  })

  it("renders the market section heading + context prose on the server", () => {
    const markup = renderToStaticMarkup(
      <HomeMarketIntro totalCards={3838} totalSets={51} />,
    )

    expect(markup).toContain("<h2")
    expect(markup).toContain("ราคาตลาดการ์ดวันพีซวันนี้")
    expect(markup).toContain("3,838")
    expect(markup).toContain("51")
    // Owner decision 2026-08-06: the trust claim is "ตลาดญี่ปุ่น", never a
    // source brand name — the intro must not advertise another shop.
    expect(markup).toContain("ตลาดญี่ปุ่น")
    expect(markup).not.toContain("Yuyu-tei")
    // Both Thai spellings must be reachable from the page body.
    expect(markup).toContain("วันพีช")
  })

  it("renders real set links, not a client-only picker", () => {
    const markup = renderToStaticMarkup(
      <HomeSetStrip
        sets={[
          { code: "OP12", name: "Legacy of the Master" },
          { code: "OP01", name: "Romance Dawn" },
        ]}
      />,
    )

    expect(markup).toContain('href="/opcg/sets/OP12"')
    expect(markup).toContain('href="/opcg/sets/OP01"')
    expect(markup).toContain('href="/opcg/sets"')
    expect(markup).toContain("ชุดการ์ดวันพีซล่าสุด")
    expect(markup).toContain("Romance Dawn")
  })

  it("renders the long-tail FAQ and its destination links on the server", () => {
    const markup = renderToStaticMarkup(<HomeSeoContent />)

    expect(markup).toContain("การ์ดวันพีซใบไหนแพงที่สุด")
    expect(markup).toContain("PSA คืออะไร ส่งเกรดการ์ดวันพีซที่ไหน")
    expect(markup).toContain("ซื้อการ์ดวันพีซที่ไหนดี")
    expect(markup).toContain("ราคากลางบน Meecard คำนวณจากอะไร")

    for (const href of [
      "/opcg/most-expensive",
      "/guide/rarities",
      "/guide/buying",
      "/opcg/sets",
    ]) {
      expect(markup).toContain(`href="${href}"`)
    }

    // FaqSection emits one FAQPage block covering every question on the page.
    expect(markup).toContain('type="application/ld+json"')
    expect(markup).toContain("FAQPage")
  })

  /**
   * Owner decision 2026-08-06 (final round): source brand names appear NOWHERE
   * in user-facing copy — not even the FAQ. The trust claim is "ตลาดญี่ปุ่น" /
   * "the Japanese market"; naming the shop advertises someone else's store and
   * makes Meecard read like a price mirror instead of the owner of its own
   * reference price. (Per-row source labels in the card-detail trade history
   * are data attribution, not copy, and are out of this rule's scope.)
   */
  it("never names a price-source brand anywhere on the page", () => {
    const surfaces = [
      renderToStaticMarkup(<HomeSeoContent />),
      renderToStaticMarkup(<HomeSearchHero sets={[]} trending={[]} />),
      renderToStaticMarkup(<HomeMarketIntro totalCards={3838} totalSets={51} />),
      renderToStaticMarkup(
        <HomeSetStrip sets={[{ code: "OP01", name: "Romance Dawn" }]} />,
      ),
    ]

    for (const markup of surfaces) {
      expect(markup).not.toContain("Yuyu-tei")
      expect(markup).not.toContain("SNKRDUNK")
    }
  })
})

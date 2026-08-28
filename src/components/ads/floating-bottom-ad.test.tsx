import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import {
  FLOATING_AD_DISMISS_KEY,
  FloatingAdFrame,
  isFloatingAdDismissed,
  persistFloatingAdDismissal,
  shouldRenderFloatingBottomAd,
} from "./floating-bottom-ad"

describe("floating bottom ad visibility", () => {
  const visibleState = {
    hydrated: true,
    dismissed: false,
    audience: "VISIBLE",
    contentAvailable: true,
    eligible: true,
  } as const

  it("renders only after route content is ready", () => {
    expect(shouldRenderFloatingBottomAd(visibleState)).toBe(true)
    expect(
      shouldRenderFloatingBottomAd({
        ...visibleState,
        contentAvailable: false,
      }),
    ).toBe(false)
  })

  it.each([
    { key: "hydration pending", patch: { hydrated: false } },
    { key: "dismissed", patch: { dismissed: true } },
    { key: "audience pending", patch: { audience: "PENDING" as const } },
    { key: "ad-free audience", patch: { audience: "HIDDEN" as const } },
    { key: "route denied", patch: { eligible: false } },
  ])("collapses when $key", ({ patch }) => {
    expect(
      shouldRenderFloatingBottomAd({ ...visibleState, ...patch }),
    ).toBe(false)
  })
})

describe("floating bottom ad dismissal", () => {
  it("persists dismissal for the current browser session", () => {
    const values = new Map<string, string>()
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value)
      },
    }

    expect(isFloatingAdDismissed(storage)).toBe(false)
    persistFloatingAdDismissal(storage)
    expect(values.get(FLOATING_AD_DISMISS_KEY)).toBe("1")
    expect(isFloatingAdDismissed(storage)).toBe(true)
  })

  it("fails open when session storage is unavailable", () => {
    const storage = {
      getItem: () => {
        throw new Error("blocked")
      },
      setItem: () => {
        throw new Error("blocked")
      },
    }

    expect(isFloatingAdDismissed(storage)).toBe(false)
    expect(() => persistFloatingAdDismissal(storage)).not.toThrow()
    expect(isFloatingAdDismissed(null)).toBe(false)
  })
})

describe("floating bottom ad frame", () => {
  it("renders above the mobile nav with an accessible close control", () => {
    const markup = renderToStaticMarkup(
      <FloatingAdFrame
        dismissLabel="ปิดโฆษณาสำหรับเซสชันนี้"
        onDismiss={vi.fn()}
      >
        <aside data-ad-zone="global-bottom-anchor">Mock ad</aside>
      </FloatingAdFrame>,
    )

    expect(markup).toContain("data-floating-ad-dock")
    expect(markup).toContain("data-floating-ad-spacer")
    expect(markup).toContain('data-ad-zone="global-bottom-anchor"')
    expect(markup).toContain('aria-label="ปิดโฆษณาสำหรับเซสชันนี้"')
    // 4rem bottom-nav + 1.75rem for the search button that overhangs it
    // (owner selection 2026-08-29) + 0.5rem breathing room. Without the
    // overhang term the dock covered that button.
    expect(markup).toContain(
      "bottom-[calc(4rem+1.75rem+env(safe-area-inset-bottom)+0.5rem)]",
    )
    expect(markup).toContain("md:bottom-4")
    // Ad dock sits on the shared stacking scale (globals.css `--z-index-ad`),
    // below the floating action bars and the site chrome.
    expect(markup).toContain("z-ad")
  })
})

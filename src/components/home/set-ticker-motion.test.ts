import { describe, expect, it } from "vitest"

import {
  AUTO_SPEED,
  NUDGE,
  isUserScroll,
  nextTickerPos,
  prewrapForNudge,
} from "./set-ticker-motion"

/**
 * The home ticker drives `scrollLeft` so the row stays a real scroll container
 * (owner ruling 2026-08-28: "อยากเลื่อนซ้ายขวาเองได้ด้วย" — the previous CSS
 * marquee animated a transform inside an overflow-hidden box, so no swipe,
 * wheel or arrow could touch it). These pin the behaviours that a browser test
 * cannot reach here, and the self-scroll bug that froze the first build.
 */
describe("home set ticker motion", () => {
  const half = 1000
  /** One frame at 60fps — the cadence the drift actually runs at. */
  const FRAME = 1 / 60

  it("drifts forward at the configured speed", () => {
    expect(
      nextTickerPos({ pos: 0, half, dtSeconds: FRAME, held: false }),
    ).toBeCloseTo(AUTO_SPEED * FRAME)
    expect(
      nextTickerPos({ pos: 100, half, dtSeconds: 0.2, held: false }),
    ).toBeCloseTo(100 + AUTO_SPEED * 0.2)
  })

  it("wraps at one copy's width so the loop has no seam", () => {
    const pos = half - 1
    const next = nextTickerPos({ pos, half, dtSeconds: 0.2, held: false })

    expect(next).not.toBeNull()
    expect(next!).toBeGreaterThanOrEqual(0)
    expect(next!).toBeLessThan(half)
    // Position is preserved modulo the copy width, so nothing visibly jumps.
    expect(next!).toBeCloseTo(pos + AUTO_SPEED * 0.2 - half)
  })

  it("hands control over while the user is on the rail", () => {
    expect(nextTickerPos({ pos: 100, half, dtSeconds: FRAME, held: true })).toBeNull()
  })

  it("skips the giant frame gap a backgrounded tab hands back", () => {
    // rAF stops entirely while a tab is hidden; without this clamp the row
    // would teleport by hundreds of pixels the moment it returns.
    expect(nextTickerPos({ pos: 0, half, dtSeconds: 8, held: false })).toBeNull()
    expect(nextTickerPos({ pos: 0, half, dtSeconds: 0, held: false })).toBeNull()
  })

  it("stays put until the track has been measured", () => {
    expect(nextTickerPos({ pos: 0, half: 0, dtSeconds: 1, held: false })).toBeNull()
  })

  /**
   * Regression: the first build held the row for every scroll event, including
   * the ones its own rAF write triggered — so it paused itself on frame one
   * and never moved again (measured: scrollLeft stuck at 1px).
   */
  it("does not mistake its own scroll writes for user input", () => {
    expect(isUserScroll(240.4, 240.4)).toBe(false)
    // Browsers may round a fractional scrollLeft when reading it back.
    expect(isUserScroll(241, 240.4)).toBe(false)
    // A finger, a wheel or an arrow moves it far further than rounding does.
    expect(isUserScroll(500, 240.4)).toBe(true)
  })

  it("hops a copy forward before stepping back from the start", () => {
    // Left arrow near 0 would hit the browser's clamp and go nowhere.
    expect(prewrapForNudge({ direction: -1, scrollLeft: 10, half })).toBe(10 + half)
    // Mid-track there is room to step back normally.
    expect(prewrapForNudge({ direction: -1, scrollLeft: NUDGE + 1, half })).toBeNull()
    // The right arrow never needs the hop — the drift's own wrap handles it.
    expect(prewrapForNudge({ direction: 1, scrollLeft: 10, half })).toBeNull()
  })
})

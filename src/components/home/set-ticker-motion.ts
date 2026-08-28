/**
 * Motion maths for the home page's latest-sets rail (`home-set-strip.tsx`).
 *
 * Kept apart from the component so it can be tested in the plain node
 * environment this repo's vitest runs in — the rail drives `scrollLeft`, so a
 * DOM-based test would be the only alternative and there is no DOM test setup
 * here.
 *
 * ⚠️ SELF-SCROLLING IS OFF (owner ruling 2026-08-28, third pass — "ขอแบบไม่ต้อง
 * เลื่อนเอง นิ่งๆ"). The rail now only moves when a person moves it, so
 * `NUDGE` is the only export the component still uses. `AUTO_SPEED`,
 * `RESUME_DELAY`, `MAX_FRAME_SECONDS`, `SELF_SCROLL_EPSILON`, `nextTickerPos`,
 * `isUserScroll` and `prewrapForNudge` are kept — with their tests — because
 * the drift has been switched on and off twice in one evening and this is the
 * whole of it, ready to reattach. Delete them (and the matching test file) once
 * the still version has stuck.
 */

/** Drift speed of the idle ticker, in CSS px per second. */
export const AUTO_SPEED = 38

/** How far one arrow press travels — a little over two pills. */
export const NUDGE = 260

/** Idle time after a manual scroll / arrow press before the drift resumes. */
export const RESUME_DELAY = 1600

/**
 * The longest frame gap the drift will act on. A backgrounded tab hands back a
 * gap of seconds when it returns (rAF stops entirely while hidden), and
 * applying that verbatim would teleport the row.
 */
export const MAX_FRAME_SECONDS = 0.25

/**
 * A scroll event does not say who caused it, so the drift's own writes look
 * exactly like user input. The component records the position it last wrote;
 * anything further away than this came from a finger, a wheel or an arrow.
 * (2px absorbs the rounding browsers apply to fractional `scrollLeft`.)
 */
export const SELF_SCROLL_EPSILON = 2

/**
 * Where the row should sit on the next frame, or `null` to leave it alone.
 *
 * `null` means "the user is in charge" — the component then syncs its own
 * position from the live `scrollLeft`, so the drift always resumes from
 * wherever the row was left.
 */
export function nextTickerPos({
  pos,
  half,
  dtSeconds,
  held,
}: {
  /** Current drift position (sub-pixel — `scrollLeft` alone would stall). */
  pos: number
  /** Half the track: one full copy of the pill list. */
  half: number
  /** Seconds since the previous frame. */
  dtSeconds: number
  /** Pointer/touch/focus on the rail, or still inside the post-scroll hold. */
  held: boolean
}): number | null {
  if (held) return null
  if (dtSeconds <= 0 || dtSeconds > MAX_FRAME_SECONDS) return null
  if (half <= 0) return null

  const next = pos + AUTO_SPEED * dtSeconds
  // The two copies are identical, so wrapping at `half` cannot be seen.
  return next >= half ? next - half : next
}

/** Did this scroll come from the user, rather than from the drift's own write? */
export function isUserScroll(scrollLeft: number, lastSelfScroll: number): boolean {
  return Math.abs(scrollLeft - lastSelfScroll) > SELF_SCROLL_EPSILON
}

/**
 * Where to jump before an arrow press, or `null` to step from where we are.
 *
 * Stepping back from the start would hit the browser's clamp at 0 and go
 * nowhere, so the row hops one copy forward first — invisible, and it makes
 * the left arrow work at any position.
 */
export function prewrapForNudge({
  direction,
  scrollLeft,
  half,
}: {
  direction: -1 | 1
  scrollLeft: number
  half: number
}): number | null {
  if (direction < 0 && half > 0 && scrollLeft < NUDGE) return scrollLeft + half
  return null
}

/**
 * Streak reward ladder — the single UI source for the daily check-in streak display.
 *
 * FREE per-day reward = CHECKIN base (5) × streak multiplier (1/2/3) = **5 / 10 / 15**.
 *
 * These MUST mirror the server authority in `src/lib/honey/index.ts`
 * (`HONEY_REWARDS.CHECKIN` + `getStreakMultiplier`). This is kept as a
 * standalone, dependency-free module so client components can import it WITHOUT
 * pulling the prisma-laden honey engine into the browser bundle. The UI used to
 * hardcode a stale **10/20/30** in ~6 places — that drifted after CHECKIN
 * dropped 10→5 (commit c094778), so FREE users saw the wrong numbers on screen.
 */
const CHECKIN_BASE = 5

/** Streak multiplier ladder: <7d → 1×, ≥7d → 2×, ≥30d → 3×. */
export function getStreakMultiplier(streak: number): number {
  if (streak >= 30) return 3
  if (streak >= 7) return 2
  return 1
}

/** Tier index for the current streak (0 = base, 1 = 7d+, 2 = 30d+). */
export function getStreakTier(streak: number): number {
  if (streak >= 30) return 2
  if (streak >= 7) return 1
  return 0
}

/** FREE per-day check-in reward at this streak (5 / 10 / 15). */
export function getStreakReward(streak: number): number {
  return CHECKIN_BASE * getStreakMultiplier(streak)
}

/** The three streak tiers with their FREE per-day reward (5 / 10 / 15). */
export const STREAK_TIERS = [
  { min: 1, max: 6, mult: 1, reward: CHECKIN_BASE * 1 },
  { min: 7, max: 29, mult: 2, reward: CHECKIN_BASE * 2 },
  { min: 30, max: Infinity, mult: 3, reward: CHECKIN_BASE * 3 },
] as const

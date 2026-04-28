export type HoneyLevel = {
  level: number;
  label: string;
  nextThreshold: number | null;
};

/**
 * Honey rebalance v2 — lifetime-honey progression ladder.
 *
 * The Master tier (15,000 lifetime) anchors the high end of the
 * earning curve: an Active player reaches it around month 18, an
 * Engaged player around month 8, and that's where shop gating maxes
 * out. Bonuses below pace alongside §3.5 of the rebalance plan.
 */

const LEVELS: { min: number; level: number; label: string }[] = [
  { min: 15000, level: 5, label: "Master" },
  { min: 5000, level: 4, label: "Diamond" },
  { min: 2000, level: 3, label: "Gold" },
  { min: 500, level: 2, label: "Silver" },
  { min: 100, level: 1, label: "Bronze" },
  { min: 0, level: 0, label: "Newbie" },
];

export const LEVEL_UP_BONUS: Record<number, number> = {
  1: 50,    // Bronze (100 lifetime)
  2: 150,   // Silver (500 lifetime)
  3: 400,   // Gold (2,000 lifetime)
  4: 1000,  // Diamond (5,000 lifetime)
  5: 2500,  // Master (15,000 lifetime)
};

/** Floor of each level — useful for shop `requiredLevel` lookups. */
export const LEVEL_THRESHOLD: Record<number, number> = {
  0: 0,
  1: 100,
  2: 500,
  3: 2000,
  4: 5000,
  5: 15000,
};

export function getHoneyLevel(lifetimeEarned: number): HoneyLevel {
  for (let i = 0; i < LEVELS.length; i++) {
    if (lifetimeEarned >= LEVELS[i].min) {
      const nextThreshold = i > 0 ? LEVELS[i - 1].min : null;
      return { level: LEVELS[i].level, label: LEVELS[i].label, nextThreshold };
    }
  }
  return { level: 0, label: "Newbie", nextThreshold: 100 };
}

/**
 * Returns the level-up bonus if `newLifetime` crossed a threshold that
 * `oldLifetime` hadn't reached yet. Returns null if no level-up occurred.
 */
export function checkLevelUp(
  oldLifetime: number,
  newLifetime: number,
): { level: number; label: string; bonus: number } | null {
  const oldLevel = getHoneyLevel(oldLifetime);
  const newLevel = getHoneyLevel(newLifetime);
  if (newLevel.level <= oldLevel.level) return null;
  const bonus = LEVEL_UP_BONUS[newLevel.level];
  if (!bonus) return null;
  return { level: newLevel.level, label: newLevel.label, bonus };
}

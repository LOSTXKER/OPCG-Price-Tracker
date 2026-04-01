export type HoneyLevel = {
  level: number;
  label: string;
  nextThreshold: number | null;
};

const LEVELS: { min: number; level: number; label: string }[] = [
  { min: 5000, level: 4, label: "Diamond" },
  { min: 2000, level: 3, label: "Gold" },
  { min: 500, level: 2, label: "Silver" },
  { min: 100, level: 1, label: "Bronze" },
  { min: 0, level: 0, label: "Newbie" },
];

export const LEVEL_UP_BONUS: Record<number, number> = {
  1: 50,   // Bronze
  2: 100,  // Silver
  3: 200,  // Gold
  4: 500,  // Diamond
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

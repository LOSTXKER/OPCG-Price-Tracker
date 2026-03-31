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

export function getHoneyLevel(lifetimeEarned: number): HoneyLevel {
  for (let i = 0; i < LEVELS.length; i++) {
    if (lifetimeEarned >= LEVELS[i].min) {
      const nextThreshold = i > 0 ? LEVELS[i - 1].min : null;
      return { level: LEVELS[i].level, label: LEVELS[i].label, nextThreshold };
    }
  }
  return { level: 0, label: "Newbie", nextThreshold: 100 };
}

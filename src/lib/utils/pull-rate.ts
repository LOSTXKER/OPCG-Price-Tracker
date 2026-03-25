/**
 * Calculate the probability of pulling a specific card.
 *
 * Uses the binomial model: P(at least 1) = 1 - ((N-1)/N)^G
 * where G = number of guaranteed/expected draws, N = pool size.
 *
 * This models G independent uniform draws from a pool of N cards
 * and returns the chance that at least one draw matches a specific card.
 */
export function pullChance(avgDraws: number, poolSize: number): number {
  if (poolSize <= 0 || avgDraws <= 0) return 0;
  return 1 - Math.pow((poolSize - 1) / poolSize, avgDraws);
}

export function formatPct(value: number): string {
  const pct = value * 100;
  if (pct >= 99.95) return "~100%";
  if (pct >= 10) return `${pct.toFixed(1)}%`;
  if (pct >= 1) return `${pct.toFixed(1)}%`;
  if (pct >= 0.1) return `${pct.toFixed(2)}%`;
  return `${pct.toFixed(3)}%`;
}

export const PACKS_PER_BOX = 24;
export const BOXES_PER_CARTON = 12;

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

/**
 * P(at least 1 specific card) across multiple independent units (packs/boxes/cartons).
 */
export function pullChanceMulti(pPerUnit: number, quantity: number): number {
  if (quantity <= 0 || pPerUnit <= 0) return 0;
  if (pPerUnit >= 1) return 1;
  return 1 - Math.pow(1 - pPerUnit, quantity);
}

/**
 * Hypergeometric model for guaranteed draws.
 * P(at least 1 specific card | G guaranteed draws from pool of N unique cards)
 *
 * More accurate than binomial for box-level guarantees where we know
 * exactly G cards will be drawn from a finite pool without replacement.
 */
export function guaranteedPull(poolSize: number, draws: number): number {
  if (poolSize <= 0 || draws <= 0) return 0;
  if (draws >= poolSize) return 1;
  let pMiss = 1;
  for (let i = 0; i < draws; i++) {
    pMiss *= (poolSize - 1 - i) / (poolSize - i);
  }
  return 1 - pMiss;
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
export const CARDS_PER_PACK_JP = 6;
export const BOXES_PER_CARTON = 12;

export const BOX_PATTERNS = [
  { name: "SEC Box", nameJp: "シークレット1枚箱", prob: 0.33, sec: 1, parallel: 0, sr: 3 },
  { name: "Parallel 1 Box", nameJp: "パラレル1枚箱", prob: 0.42, sec: 0, parallel: 1, sr: 3 },
  { name: "Parallel 2 Box", nameJp: "パラレル2枚箱", prob: 0.25, sec: 0, parallel: 2, sr: 3 },
] as const;

export const CARTON_ESTIMATES = {
  sec: 4,
  sr: 42,
  parallel: 8,
  leaderParallel: 2,
  sp: 1,
} as const;

/** P(at least 1 SEC box in N boxes) */
export function chanceOfSecInBoxes(n: number): number {
  const pNoSec = 1 - BOX_PATTERNS[0].prob;
  return 1 - Math.pow(pNoSec, n);
}

/**
 * Expected parallel-art slots per box, weighted across box patterns.
 * SEC Box (33%): 0 parallel, Parallel 1 Box (42%): 1, Parallel 2 Box (25%): 2
 */
export const EXPECTED_PARALLEL_SLOTS_PER_BOX =
  BOX_PATTERNS[0].prob * BOX_PATTERNS[0].parallel +
  BOX_PATTERNS[1].prob * BOX_PATTERNS[1].parallel +
  BOX_PATTERNS[2].prob * BOX_PATTERNS[2].parallel;

/**
 * Fallback avgPerBox when no drop-rate data is available.
 * Based on typical JP booster pack composition (6 cards: 3C + 1UC + 1R + 1R/UC).
 */
const FALLBACK_AVG_PER_BOX: Record<string, number> = {
  C: 72,
  UC: 24,
  R: 24,
};

/**
 * Calculate the probability of pulling a specific card from a box,
 * taking into account the 3 box patterns and their guarantees.
 *
 * @param rarity     The rarity string of the card (e.g. "C", "SR", "SEC")
 * @param poolSize   Number of unique cards of the same rarity (normal-only or parallel-only)
 * @param avgPerBox  Expected draws of this rarity per box (from drop-rate DB)
 * @param isParallel Whether the card is a parallel-art variant
 * @param totalParallelPool Total parallel cards in the set (used when isParallel=true)
 */
export function cardChancePerBox(
  rarity: string,
  poolSize: number,
  avgPerBox: number,
  isParallel: boolean = false,
  totalParallelPool: number = 0
): number {
  if (poolSize <= 0) return 0;

  const r = rarity.toUpperCase();

  if (isParallel || r.startsWith("P-") || r === "SP" || r === "SP CARD") {
    const pool = totalParallelPool > 0 ? totalParallelPool : poolSize;
    if (pool <= 0 || EXPECTED_PARALLEL_SLOTS_PER_BOX <= 0) return 0;
    return 1 - Math.pow(1 - 1 / pool, EXPECTED_PARALLEL_SLOTS_PER_BOX);
  }

  if (r === "SR") {
    return guaranteedPull(poolSize, 3);
  }

  if (r === "SEC") {
    const pSecBox = BOX_PATTERNS[0].prob;
    return pSecBox * (1 / poolSize);
  }

  const avg = avgPerBox > 0 ? avgPerBox : (FALLBACK_AVG_PER_BOX[r] ?? 0);
  if (avg > 0) {
    return pullChance(avg, poolSize);
  }

  return 0;
}

export const COMMUNITY_SOURCES = [
  {
    name: "cardcosmos.de",
    label: "Pull rates per box/case",
    url: "https://cardcosmos.de/en-eu/blogs/news/one-piece-card-game-pull-rates-hitrates-der-japanischen-edition",
  },
  {
    name: "トレカビギン",
    label: "Box patterns (封入パターン)",
    url: "https://onepiece-card-zanmai.jp/box-enclosed-pattern/",
  },
  {
    name: "Gamerch Wiki",
    label: "Box/carton enclosure rates",
    url: "https://gamerch.com/onepiececard/491812",
  },
  {
    name: "かちおテック",
    label: "Rarity + probability guide",
    url: "https://www.kachiotech.com/one-piece-cardgame-rarity-guide/",
  },
] as const;

export function officialProductUrl(setCode: string): string {
  return `https://www.onepiece-cardgame.com/products/boosters/${setCode.toLowerCase()}.php`;
}

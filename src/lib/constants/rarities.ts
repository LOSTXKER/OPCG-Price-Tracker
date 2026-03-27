export type RarityInfo = {
  code: string;
  name: string;
  order: number;
  color: string;
  isParallel?: boolean;
};

/** Official base rarities sourced from Bandai */
export const BASE_RARITIES: RarityInfo[] = [
  { code: "TR", name: "Treasure Rare", order: 11, color: "#EF4444" },
  { code: "SP", name: "Special (Manga Art)", order: 10, color: "#EC4899" },
  { code: "SEC", name: "Secret Rare", order: 9, color: "#F59E0B" },
  { code: "SR", name: "Super Rare", order: 8, color: "#8B5CF6" },
  { code: "R", name: "Rare", order: 7, color: "#3B82F6" },
  { code: "UC", name: "Uncommon", order: 6, color: "#22C55E" },
  { code: "C", name: "Common", order: 5, color: "#6B7280" },
  { code: "L", name: "Leader", order: 4, color: "#F97316" },
  { code: "DON", name: "DON!!", order: 3, color: "#EA580C" },
  { code: "P", name: "Promo", order: 2, color: "#06B6D4" },
];

/** Parallel variants created by Yuyu-tei price scraping */
export const PARALLEL_RARITIES: RarityInfo[] = [
  { code: "P-SEC", name: "Parallel Secret Rare", order: 9, color: "#F59E0B", isParallel: true },
  { code: "P-SR", name: "Parallel Super Rare", order: 8, color: "#8B5CF6", isParallel: true },
  { code: "P-R", name: "Parallel Rare", order: 7, color: "#3B82F6", isParallel: true },
  { code: "P-UC", name: "Parallel Uncommon", order: 6, color: "#22C55E", isParallel: true },
  { code: "P-C", name: "Parallel Common", order: 5, color: "#6B7280", isParallel: true },
  { code: "P-L", name: "Parallel Leader", order: 4, color: "#F97316", isParallel: true },
  { code: "P-P", name: "Parallel Promo", order: 2, color: "#06B6D4", isParallel: true },
];

export const RARITIES: RarityInfo[] = [...BASE_RARITIES, ...PARALLEL_RARITIES];

export const RARITY_MAP = new Map(RARITIES.map((r) => [r.code, r]));

export const BASE_RARITY_CODES = new Set(BASE_RARITIES.map((r) => r.code));

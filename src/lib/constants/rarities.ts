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

/* ── Badge / bar / hex color maps (previously in rarity.ts) ── */

export const RARITY_BADGE_ACCENT: Record<string, { text: string; bg: string }> = {
  TR:     { text: "text-red-700 dark:text-red-300",       bg: "bg-red-500/15 dark:bg-red-500/25" },
  SEC:    { text: "text-amber-700 dark:text-amber-300",   bg: "bg-amber-500/15 dark:bg-amber-500/25" },
  "P-SEC":{ text: "text-amber-700 dark:text-amber-300",   bg: "bg-amber-500/15 dark:bg-amber-500/25" },
  SP:     { text: "text-pink-700 dark:text-pink-300",     bg: "bg-pink-500/15 dark:bg-pink-500/25" },
  "P-SP": { text: "text-pink-700 dark:text-pink-300",     bg: "bg-pink-500/15 dark:bg-pink-500/25" },
  SR:     { text: "text-purple-700 dark:text-purple-300", bg: "bg-purple-500/15 dark:bg-purple-500/25" },
  "P-SR": { text: "text-purple-700 dark:text-purple-300", bg: "bg-purple-500/15 dark:bg-purple-500/25" },
  R:      { text: "text-blue-700 dark:text-blue-300",     bg: "bg-blue-500/15 dark:bg-blue-500/25" },
  "P-R":  { text: "text-blue-700 dark:text-blue-300",     bg: "bg-blue-500/15 dark:bg-blue-500/25" },
  UC:     { text: "text-emerald-700 dark:text-emerald-300",bg: "bg-emerald-500/15 dark:bg-emerald-500/25" },
  "P-UC": { text: "text-emerald-700 dark:text-emerald-300",bg: "bg-emerald-500/15 dark:bg-emerald-500/25" },
  C:      { text: "text-slate-600 dark:text-slate-300",   bg: "bg-slate-500/15 dark:bg-slate-500/25" },
  "P-C":  { text: "text-slate-600 dark:text-slate-300",   bg: "bg-slate-500/15 dark:bg-slate-500/25" },
  L:      { text: "text-orange-700 dark:text-orange-300", bg: "bg-orange-500/15 dark:bg-orange-500/25" },
  "P-L":  { text: "text-orange-700 dark:text-orange-300", bg: "bg-orange-500/15 dark:bg-orange-500/25" },
  DON:    { text: "text-red-700 dark:text-red-300",       bg: "bg-red-500/15 dark:bg-red-500/25" },
  P:      { text: "text-cyan-700 dark:text-cyan-300",     bg: "bg-cyan-500/15 dark:bg-cyan-500/25" },
  "P-P":  { text: "text-cyan-700 dark:text-cyan-300",     bg: "bg-cyan-500/15 dark:bg-cyan-500/25" },
};

export const RARITY_BAR_COLOR: Record<string, string> = {
  SP: "bg-pink-500",
  "P-SP": "bg-pink-500",
  "P-SEC": "bg-amber-500",
  SEC: "bg-amber-500",
  "P-SR": "bg-purple-500",
  SR: "bg-purple-500",
  "P-R": "bg-blue-500",
  R: "bg-blue-500",
  L: "bg-orange-500",
  "P-L": "bg-orange-500",
  "P-UC": "bg-emerald-500",
  UC: "bg-emerald-500",
  "P-C": "bg-neutral-400",
  C: "bg-neutral-400",
  DON: "bg-red-500",
  TR: "bg-red-500",
};

export const RARITY_HEX: Record<string, string> = {
  SEC: "#F59E0B",
  SR: "#8B5CF6",
  R: "#3B82F6",
  UC: "#22C55E",
  C: "#6B7280",
  L: "#EF4444",
  SP: "#EC4899",
  "P-SEC": "#F59E0B",
  "P-SR": "#8B5CF6",
  "P-R": "#3B82F6",
  "P-UC": "#22C55E",
  "P-C": "#6B7280",
  "P-L": "#EF4444",
  "P-SP": "#EC4899",
  DON: "#EF4444",
  TR: "#EF4444",
};

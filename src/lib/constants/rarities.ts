export type RarityInfo = {
  code: string;
  name: string;
  order: number;
  color: string;
};

export const RARITIES: RarityInfo[] = [
  { code: "L", name: "Leader", order: 8, color: "#F97316" },
  { code: "SEC", name: "Secret Rare", order: 7, color: "#F59E0B" },
  { code: "P-SEC", name: "Parallel Secret Rare", order: 7, color: "#F59E0B" },
  { code: "SP", name: "Special", order: 9, color: "#EC4899" },
  { code: "SR", name: "Super Rare", order: 6, color: "#8B5CF6" },
  { code: "P-SR", name: "Parallel Super Rare", order: 6, color: "#8B5CF6" },
  { code: "R", name: "Rare", order: 5, color: "#3B82F6" },
  { code: "P-R", name: "Parallel Rare", order: 5, color: "#3B82F6" },
  { code: "UC", name: "Uncommon", order: 4, color: "#22C55E" },
  { code: "P-UC", name: "Parallel Uncommon", order: 4, color: "#22C55E" },
  { code: "C", name: "Common", order: 3, color: "#6B7280" },
  { code: "P-C", name: "Parallel Common", order: 3, color: "#6B7280" },
  { code: "P", name: "Promo", order: 2, color: "#06B6D4" },
  { code: "P-P", name: "Parallel Promo", order: 2, color: "#06B6D4" },
  { code: "P-L", name: "Parallel Leader", order: 8, color: "#F97316" },
];

export const RARITY_MAP = new Map(RARITIES.map((r) => [r.code, r]));

export interface DropRate {
  id: number;
  rarity: string;
  avgPerBox: number | null;
  ratePerPack: number | null;
}

export interface SetData {
  id: number;
  code: string;
  name: string;
  nameEn: string | null;
  type: string;
  packsPerBox: number | null;
  cardsPerPack: number | null;
  dropRates: DropRate[];
}

export type RateEdits = Record<string, { avgPerBox: string; ratePerPack: string }>;

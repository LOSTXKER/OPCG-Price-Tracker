import type { SetInfo } from "@/lib/constants/sets";
import type { RarityInfo } from "@/lib/constants/rarities";

export interface CardTypeOption {
  code: string;
  label: string;
}

export interface ColorOption {
  code: string;
  label: string;
  bg: string;
}

export interface RarityOption {
  code: string;
  label: string;
}

export interface BoxPattern {
  name: string;
  nameJp: string;
  prob: number;
  sec: number;
  parallel: number;
  sr: number;
}

export interface PullRateConfig {
  packsPerBox: number;
  cardsPerPack: number;
  boxesPerCarton: number;
  boxPatterns: readonly BoxPattern[];
  expectedParallelSlotsPerBox: number;
  fallbackAvgPerBox: Record<string, number>;
}

export interface GameConfig {
  slug: string;
  name: string;
  nameEn: string;
  sets: SetInfo[];
  baseRarities: RarityInfo[];
  parallelRarities: RarityInfo[];
  cardTypes: CardTypeOption[];
  colors: ColorOption[];
  rarityFilterOptions: RarityOption[];
  pullRate: PullRateConfig;
  officialCardImageBase?: string;
  officialProductUrl?: (setCode: string) => string;
}

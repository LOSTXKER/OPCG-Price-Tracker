import type { PaginatedApiResponse } from "@/app/admin/admin-types";

export interface CardRow {
  id: number;
  cardCode: string;
  baseCode: string | null;
  nameJp: string;
  nameEn: string | null;
  nameTh: string | null;
  rarity: string;
  cardType: string;
  color: string;
  colorEn: string | null;
  imageUrl: string | null;
  isParallel: boolean;
  parallelIndex: number | null;
  latestPriceJpy: number | null;
  set: { code: string; name: string };
}

export interface FilterOptions {
  sets: {
    code: string;
    name: string;
    nameEn: string | null;
    nameTh?: string | null;
    type: string;
    imageUrl?: string | null;
    releaseDate?: string | null;
  }[];
  rarities: string[];
}

export interface ApiResponse extends PaginatedApiResponse {
  cards: CardRow[];
  limit: number;
}

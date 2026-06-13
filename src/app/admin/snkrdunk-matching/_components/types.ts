import type { MatchingCard } from "@/components/admin/matching-ui";
import type { PaginatedApiResponse } from "@/app/admin/admin-types";

export type MappingCard = MatchingCard;

export interface Mapping {
  id: number;
  snkrdunkId: number;
  productNumber: string;
  scrapedName: string;
  thumbnailUrl: string | null;
  minPriceUsd: number | null;
  usedMinPriceUsd: number | null;
  lastSoldPsa10Usd: number | null;
  matchedCardId: number | null;
  matchedCard: MappingCard | null;
  matchMethod: string | null;
  status: string;
  updatedAt: string;
  actionAt: string | null;
  actionByUser: { displayName: string | null; email: string } | null;
  candidates: MappingCard[];
}

export interface ApiResponse extends PaginatedApiResponse {
  mappings: Mapping[];
  counts: Record<string, number>;
}

export type SortKey =
  | ""
  | "product-asc"
  | "product-desc"
  | "price-asc"
  | "price-desc"
  | "date-asc"
  | "date-desc";

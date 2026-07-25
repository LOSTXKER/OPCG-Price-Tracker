import type { CardSearchFacets } from "@/lib/cards/search-filters";
import type { GradeKey } from "@/lib/pricing/grade-tiers";

export interface FetchCardsParams {
  search?: string;
  sort?: string;
  set?: string;
  rarity?: string;
  color?: string;
  type?: string;
  /** "regular" | "parallel" — filters by isParallel; omit for both. */
  variant?: string;
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  grade?: GradeKey;
  /** @deprecated Compatibility with the former Raw/PSA 10 query. */
  priceMode?: "psa10";
  popular?: boolean;
  includeFacets?: boolean;
  ids?: number[];
  [key: string]: string | number | boolean | number[] | undefined;
}

export interface CardResult {
  id?: number;
  cardCode: string;
  baseCode?: string | null;
  nameJp: string;
  nameEn?: string | null;
  nameTh?: string | null;
  rarity: string;
  isParallel: boolean;
  imageUrl?: string | null;
  latestPriceJpy?: number | null;
  latestPriceThb?: number | null;
  psa10PriceUsd?: number | null;
  priceChange24h?: number | null;
  priceChange7d?: number | null;
  priceChange30d?: number | null;
  viewCount?: number;
  setCode?: string;
  set?: { code: string; name?: string; nameEn?: string | null };
}

export interface CardsApiResponse {
  cards: CardResult[];
  total: number;
  page: number;
  totalPages: number;
  facets?: CardSearchFacets;
}

export function buildCardsUrl(params: FetchCardsParams): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "" || v === false) continue;
    if (k === "ids" && Array.isArray(v)) {
      sp.set(k, v.join(","));
    } else {
      sp.set(k, String(v));
    }
  }
  return `/api/cards?${sp}`;
}

export async function fetchCards(
  params: FetchCardsParams,
  init?: RequestInit,
): Promise<CardsApiResponse> {
  const res = await fetch(buildCardsUrl(params), init);
  if (!res.ok) throw new Error(`fetchCards failed: ${res.status}`);
  return res.json();
}

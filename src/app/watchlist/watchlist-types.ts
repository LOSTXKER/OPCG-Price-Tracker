import type { GameRef } from "@/lib/types/portfolio";

export type WatchCard = {
  id: number;
  cardCode: string;
  baseCode: string | null;
  nameJp: string;
  nameEn: string | null;
  nameTh: string | null;
  rarity: string;
  imageUrl: string | null;
  latestPriceJpy: number | null;
  latestPriceThb: number | null;
  priceChange24h: number | null;
  priceChange7d: number | null;
  priceChange30d: number | null;
  /** `game` (via set) drives the in-view game chips on the unified watchlist. */
  set: { code: string; game: GameRef | null };
};

export type WatchlistEntry = {
  id: number;
  cardId: number;
  pinnedAt: string | null;
  addedAt: string;
  hasActiveAlert: boolean;
  card: WatchCard;
};

export type WatchView = "list" | "grid";

export type ChangePeriod = "24h" | "7d" | "30d";

export type SortKey =
  | "default"
  | "recent"
  | "gain"
  | "loss"
  | "priceHigh"
  | "priceLow"
  | "nameAz"
  | "nameZa";

export type WatchlistFilters = {
  setCode: string | null;
  direction: "up" | "down" | null;
  hasAlert: boolean;
  pinnedOnly: boolean;
};

export const DEFAULT_FILTERS: WatchlistFilters = {
  setCode: null,
  direction: null,
  hasAlert: false,
  pinnedOnly: false,
};

export type WatchlistPanelState = {
  status: "loading" | "ready" | "empty" | "error";
  itemCount: number;
};

export function getEntryChange(entry: WatchlistEntry, period: ChangePeriod): number | null {
  switch (period) {
    case "24h":
      return entry.card.priceChange24h;
    case "30d":
      return entry.card.priceChange30d;
    case "7d":
    default:
      return entry.card.priceChange7d;
  }
}

import {
  getEntryChange,
  type ChangePeriod,
  type SortKey,
  type WatchlistEntry,
  type WatchlistFilters,
} from "./watchlist-types";
import { ALL_GAMES, DEFAULT_GAME } from "@/lib/game/constants";

export type WatchlistFilterOptions = {
  filters: WatchlistFilters;
  period: ChangePeriod;
  search?: string;
  gameFilter?: string;
};

function isEntryInGame(entry: WatchlistEntry, gameFilter: string): boolean {
  return (
    gameFilter === ALL_GAMES ||
    (entry.card.set.game?.slug ?? DEFAULT_GAME) === gameFilter
  );
}

/** Apply the watchlist's in-page filters without mutating or reordering input. */
export function filterEntries(
  entries: readonly WatchlistEntry[],
  {
    filters,
    period,
    search = "",
    gameFilter = ALL_GAMES,
  }: WatchlistFilterOptions,
): WatchlistEntry[] {
  const query = search.trim().toLocaleLowerCase();

  return entries.filter((entry) => {
    if (!isEntryInGame(entry, gameFilter)) return false;
    if (filters.pinnedOnly && entry.pinnedAt == null) return false;
    if (filters.hasAlert && !entry.hasActiveAlert) return false;
    if (filters.setCode && entry.card.set.code !== filters.setCode) return false;

    if (filters.direction) {
      const change = getEntryChange(entry, period);
      if (change == null) return false;
      if (filters.direction === "up" && change <= 0) return false;
      if (filters.direction === "down" && change >= 0) return false;
    }

    if (query) {
      const searchableText = [
        entry.card.nameEn,
        entry.card.nameJp,
        entry.card.nameTh,
        entry.card.cardCode,
      ]
        .filter((value): value is string => Boolean(value))
        .join(" ")
        .toLocaleLowerCase();
      if (!searchableText.includes(query)) return false;
    }

    return true;
  });
}

/** Clear a set selection when it does not belong to the newly selected game. */
export function ensureValidSetCode(
  entries: readonly WatchlistEntry[],
  gameFilter: string,
  setCode: string | null,
): string | null {
  if (!setCode) return null;
  return entries.some(
    (entry) =>
      isEntryInGame(entry, gameFilter) && entry.card.set.code === setCode,
  )
    ? setCode
    : null;
}

/** Number shown on the Filter button; Set lives in its own picker. */
export function countActiveWatchlistModalFilters(
  filters: WatchlistFilters,
): number {
  return (
    Number(filters.direction !== null) +
    Number(filters.hasAlert) +
    Number(filters.pinnedOnly)
  );
}

/** Count every active constraint, including the separate Set picker. */
export function countActiveWatchlistFilters(filters: WatchlistFilters): number {
  return (
    countActiveWatchlistModalFilters(filters) + Number(filters.setCode !== null)
  );
}

export function filterAndSortEntries(
  entries: readonly WatchlistEntry[],
  options: WatchlistFilterOptions,
  sortKey: SortKey,
): WatchlistEntry[] {
  return sortEntries(filterEntries(entries, options), sortKey, options.period);
}

/** ขยับแรงวันนี้ shelf — |%change| ≥ 1, biggest swing first, capped at 6. */
export const WATCHLIST_MOVER_THRESHOLD_PCT = 1;
export const WATCHLIST_MOVER_LIMIT = 6;
export const WATCHLIST_MOVER_MIN_ITEMS = 4;

/**
 * Pure membership rule for the mover shelf so "does this card qualify" is
 * unit-testable without mounting the shelf component. Runs over ALL entries
 * (not the filtered/sorted view) — the shelf is a lens on the whole
 * watchlist, independent of the page's search/filter state.
 */
export function selectWatchlistMovers(
  entries: readonly WatchlistEntry[],
  period: ChangePeriod,
  limit: number = WATCHLIST_MOVER_LIMIT,
): WatchlistEntry[] {
  return entries
    .filter((entry) => {
      const change = getEntryChange(entry, period);
      return change != null && Math.abs(change) >= WATCHLIST_MOVER_THRESHOLD_PCT;
    })
    .sort(
      (a, b) =>
        Math.abs(getEntryChange(b, period) ?? 0) - Math.abs(getEntryChange(a, period) ?? 0),
    )
    .slice(0, limit);
}

export function sortEntries(
  entries: readonly WatchlistEntry[],
  key: SortKey,
  period: ChangePeriod,
): WatchlistEntry[] {
  const arr = [...entries];

  if (key === "default") {
    arr.sort((a, b) => {
      const aPin = a.pinnedAt ? new Date(a.pinnedAt).getTime() : 0;
      const bPin = b.pinnedAt ? new Date(b.pinnedAt).getTime() : 0;
      if (aPin !== bPin) return bPin - aPin;
      return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
    });
    return arr;
  }

  const pinnedFirst = (a: WatchlistEntry, b: WatchlistEntry): number => {
    const aPin = a.pinnedAt ? 1 : 0;
    const bPin = b.pinnedAt ? 1 : 0;
    return bPin - aPin;
  };

  switch (key) {
    case "recent":
      arr.sort((a, b) => {
        const pin = pinnedFirst(a, b);
        if (pin !== 0) return pin;
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      });
      break;
    case "gain":
      arr.sort((a, b) => {
        const pin = pinnedFirst(a, b);
        if (pin !== 0) return pin;
        const av = getEntryChange(a, period) ?? -Infinity;
        const bv = getEntryChange(b, period) ?? -Infinity;
        return bv - av;
      });
      break;
    case "loss":
      arr.sort((a, b) => {
        const pin = pinnedFirst(a, b);
        if (pin !== 0) return pin;
        const av = getEntryChange(a, period) ?? Infinity;
        const bv = getEntryChange(b, period) ?? Infinity;
        return av - bv;
      });
      break;
    case "priceHigh":
      arr.sort((a, b) => {
        const pin = pinnedFirst(a, b);
        if (pin !== 0) return pin;
        const av = a.card.latestPriceJpy ?? -Infinity;
        const bv = b.card.latestPriceJpy ?? -Infinity;
        return bv - av;
      });
      break;
    case "priceLow":
      arr.sort((a, b) => {
        const pin = pinnedFirst(a, b);
        if (pin !== 0) return pin;
        const av = a.card.latestPriceJpy ?? Infinity;
        const bv = b.card.latestPriceJpy ?? Infinity;
        return av - bv;
      });
      break;
    case "nameAz":
    case "nameZa":
      arr.sort((a, b) => {
        const pin = pinnedFirst(a, b);
        if (pin !== 0) return pin;
        const an = (
          a.card.nameEn ?? a.card.nameJp ?? a.card.cardCode
        ).toLowerCase();
        const bn = (
          b.card.nameEn ?? b.card.nameJp ?? b.card.cardCode
        ).toLowerCase();
        return key === "nameZa"
          ? bn.localeCompare(an)
          : an.localeCompare(bn);
      });
      break;
  }
  return arr;
}

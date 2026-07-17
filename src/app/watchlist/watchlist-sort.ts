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

/** Keep the select-mode picks a subset of the visible entries. Any constraint
 *  change (search/filters/game/period) or background refresh can hide rows —
 *  a pick that lingers on a hidden row would let the selection bar count (and
 *  bulk-remove delete) cards the user can no longer see. Returns the same Set
 *  instance when nothing was pruned so state setters can bail out. */
export function pruneSelectedToVisible(
  selected: Set<number>,
  visibleEntries: readonly WatchlistEntry[],
): Set<number> {
  if (selected.size === 0) return selected;
  const visible = new Set(visibleEntries.map((e) => e.cardId));
  const next = new Set<number>();
  selected.forEach((id) => {
    if (visible.has(id)) next.add(id);
  });
  return next.size === selected.size ? selected : next;
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
    Number(filters.direction !== null) + Number(filters.hasAlert)
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

export function sortEntries(
  entries: readonly WatchlistEntry[],
  key: SortKey,
  period: ChangePeriod,
): WatchlistEntry[] {
  const arr = [...entries];

  // "default" = newest additions first (the pin system was removed 2026-07-17
  // by owner decision — no pinned-first tier anywhere).
  if (key === "default") {
    arr.sort(
      (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime(),
    );
    return arr;
  }

  switch (key) {
    case "recent":
      arr.sort((a, b) => {
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      });
      break;
    case "gain":
      arr.sort((a, b) => {
        const av = getEntryChange(a, period) ?? -Infinity;
        const bv = getEntryChange(b, period) ?? -Infinity;
        return bv - av;
      });
      break;
    case "loss":
      arr.sort((a, b) => {
        const av = getEntryChange(a, period) ?? Infinity;
        const bv = getEntryChange(b, period) ?? Infinity;
        return av - bv;
      });
      break;
    case "priceHigh":
      arr.sort((a, b) => {
        const av = a.card.latestPriceJpy ?? -Infinity;
        const bv = b.card.latestPriceJpy ?? -Infinity;
        return bv - av;
      });
      break;
    case "priceLow":
      arr.sort((a, b) => {
        const av = a.card.latestPriceJpy ?? Infinity;
        const bv = b.card.latestPriceJpy ?? Infinity;
        return av - bv;
      });
      break;
    case "nameAz":
    case "nameZa":
      arr.sort((a, b) => {
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

import {
  getEntryChange,
  type ChangePeriod,
  type SortKey,
  type WatchlistEntry,
} from "./watchlist-types";

export function sortEntries(
  entries: WatchlistEntry[],
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
      arr.sort((a, b) => {
        const pin = pinnedFirst(a, b);
        if (pin !== 0) return pin;
        const an = (
          a.card.nameEn ?? a.card.nameJp ?? a.card.cardCode
        ).toLowerCase();
        const bn = (
          b.card.nameEn ?? b.card.nameJp ?? b.card.cardCode
        ).toLowerCase();
        return an.localeCompare(bn);
      });
      break;
    case "target":
      arr.sort((a, b) => {
        const pin = pinnedFirst(a, b);
        if (pin !== 0) return pin;
        const aDist = targetDistance(a);
        const bDist = targetDistance(b);
        return aDist - bDist;
      });
      break;
  }
  return arr;
}

function targetDistance(entry: WatchlistEntry): number {
  if (entry.targetPriceJpy == null || entry.card.latestPriceJpy == null) {
    return Infinity;
  }
  const t = entry.targetPriceJpy;
  const c = entry.card.latestPriceJpy;
  return Math.abs(c - t) / t;
}

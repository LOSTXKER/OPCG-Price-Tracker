import { describe, expect, it } from "vitest";

import { ALL_GAMES } from "@/lib/game/constants";

import {
  countActiveWatchlistFilters,
  countActiveWatchlistModalFilters,
  ensureValidSetCode,
  filterAndSortEntries,
  filterEntries,
  sortEntries,
} from "./watchlist-sort";
import {
  DEFAULT_FILTERS,
  type WatchlistEntry,
  type WatchlistFilters,
} from "./watchlist-types";

function entry(
  id: number,
  overrides: {
    addedAt?: string;
    alert?: boolean;
    change?: number | null;
    code?: string;
    game?: string;
    nameEn?: string | null;
    nameJp?: string;
    nameTh?: string | null;
    pinnedAt?: string | null;
    setCode?: string;
  } = {},
): WatchlistEntry {
  const game = overrides.game ?? "opcg";
  return {
    id,
    cardId: id,
    pinnedAt: overrides.pinnedAt ?? null,
    addedAt: overrides.addedAt ?? `2026-07-${String(id).padStart(2, "0")}T00:00:00.000Z`,
    hasActiveAlert: overrides.alert ?? false,
    card: {
      id,
      cardCode: overrides.code ?? `OP01-00${id}`,
      baseCode: null,
      nameJp: overrides.nameJp ?? `カード ${id}`,
      nameEn: overrides.nameEn ?? `Card ${id}`,
      nameTh: overrides.nameTh ?? null,
      rarity: "SR",
      imageUrl: null,
      latestPriceJpy: id * 100,
      latestPriceThb: id * 25,
      priceChange24h: overrides.change ?? null,
      priceChange7d: overrides.change ?? null,
      priceChange30d: overrides.change ?? null,
      set: {
        code: overrides.setCode ?? "OP01",
        game: {
          slug: game,
          name: game,
          nameEn: game,
          logoUrl: null,
        },
      },
    },
  };
}

const entries = [
  entry(1, {
    alert: true,
    change: 8,
    nameEn: "Portgas D. Ace",
    nameTh: "เอส",
    pinnedAt: "2026-07-10T00:00:00.000Z",
    setCode: "OP01",
  }),
  entry(2, {
    change: -4,
    code: "OP02-001",
    nameEn: "Monkey D. Luffy",
    nameJp: "モンキー・D・ルフィ",
    setCode: "OP02",
  }),
  entry(3, {
    alert: true,
    change: 0,
    code: "SV1-001",
    game: "pokemon",
    nameEn: "Pikachu",
    pinnedAt: "2026-07-11T00:00:00.000Z",
    setCode: "SV1",
  }),
];

function filters(overrides: Partial<WatchlistFilters> = {}): WatchlistFilters {
  return { ...DEFAULT_FILTERS, ...overrides };
}

describe("watchlist filtering", () => {
  it("combines game, set, status, movement, and multilingual search filters", () => {
    expect(
      filterEntries(entries, {
        filters: filters({
          setCode: "OP01",
          direction: "up",
          hasAlert: true,
        }),
        period: "7d",
        search: " เอส ",
        gameFilter: "opcg",
      }).map((item) => item.cardId),
    ).toEqual([1]);

    expect(
      filterEntries(entries, {
        filters: filters({ direction: "down" }),
        period: "7d",
        search: "op02-001",
      }).map((item) => item.cardId),
    ).toEqual([2]);
  });

  it("excludes zero and missing changes from directional filters", () => {
    expect(
      filterEntries(entries, {
        filters: filters({ direction: "up" }),
        period: "24h",
      }).map((item) => item.cardId),
    ).toEqual([1]);
    expect(
      filterEntries(entries, {
        filters: filters({ direction: "down" }),
        period: "30d",
      }).map((item) => item.cardId),
    ).toEqual([2]);
  });

  it("keeps the set only while it is valid for the selected game", () => {
    expect(ensureValidSetCode(entries, "opcg", "OP01")).toBe("OP01");
    expect(ensureValidSetCode(entries, "pokemon", "OP01")).toBeNull();
    expect(ensureValidSetCode(entries, ALL_GAMES, "OP01")).toBe("OP01");
    expect(ensureValidSetCode(entries, "opcg", null)).toBeNull();
  });

  it("counts modal facets separately from the external set picker", () => {
    const active = filters({
      setCode: "OP01",
      direction: "up",
      hasAlert: true,
    });
    expect(countActiveWatchlistModalFilters(active)).toBe(2);
    expect(countActiveWatchlistFilters(active)).toBe(3);
  });
});

describe("watchlist sorting", () => {
  it("orders the default view newest-first (the pin tier is gone)", () => {
    const unsorted = [
      entry(4, { addedAt: "2026-07-14T00:00:00.000Z" }),
      entry(1, { addedAt: "2026-07-01T00:00:00.000Z" }),
      entry(3, { addedAt: "2026-07-03T00:00:00.000Z" }),
      entry(2, { addedAt: "2026-07-12T00:00:00.000Z" }),
    ];

    expect(sortEntries(unsorted, "default", "7d").map((item) => item.cardId)).toEqual([
      4,
      2,
      3,
      1,
    ]);
    expect(unsorted.map((item) => item.cardId)).toEqual([4, 1, 3, 2]);
  });

  it("returns the filtered result count and sorted rows from one helper", () => {
    const result = filterAndSortEntries(
      entries,
      {
        filters: filters(),
        period: "7d",
        gameFilter: "opcg",
      },
      "gain",
    );

    expect(result).toHaveLength(2);
    expect(result.map((item) => item.cardId)).toEqual([1, 2]);
  });
});

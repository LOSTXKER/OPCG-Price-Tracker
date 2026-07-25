import { describe, expect, it } from "vitest";

import { ALL_GAMES } from "@/lib/game/constants";

import {
  countActiveWatchlistFilters,
  countActiveWatchlistModalFilters,
  ensureValidSetCode,
  filterAndSortEntries,
  filterEntries,
  normalizeWatchlistSortForGrade,
  pruneSelectedToVisible,
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
    psaPrice?: number | null;
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
      psa10PriceUsd: overrides.psaPrice ?? null,
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

  it("prunes select-mode picks to the visible entries", () => {
    const selected = new Set([1, 2, 3]);
    expect(pruneSelectedToVisible(selected, [entries[0], entries[2]])).toEqual(
      new Set([1, 3]),
    );
  });

  it("returns the same selection instance when nothing is hidden", () => {
    const selected = new Set([1, 2]);
    expect(pruneSelectedToVisible(selected, entries)).toBe(selected);
    const empty = new Set<number>();
    expect(pruneSelectedToVisible(empty, [])).toBe(empty);
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

  it.each(["psa_10", "psa_9", "psa_8", "bgs_95"] as const)(
    "keeps only cards with a real PSA 10 anchor in the %s lens",
    (grade) => {
      const result = filterEntries(
        [
          entry(1, { psaPrice: 45 }),
          entry(2, { psaPrice: null }),
          entry(3, { psaPrice: 0 }),
        ],
        {
          filters: filters(),
          period: "7d",
          grade,
        },
      );

      expect(result.map((item) => item.cardId)).toEqual([1]);
    },
  );

  it("normalizes Raw-only change sorts when leaving the Raw lens", () => {
    expect(normalizeWatchlistSortForGrade("gain", "psa_10")).toBe("priceHigh");
    expect(normalizeWatchlistSortForGrade("loss", "psa_9")).toBe("priceHigh");
    expect(normalizeWatchlistSortForGrade("gain", "raw")).toBe("gain");
    expect(normalizeWatchlistSortForGrade("nameAz", "bgs_95")).toBe("nameAz");
  });

  it("applies the normalized price sort even during a grade transition", () => {
    const result = filterAndSortEntries(
      [
        entry(1, { change: 99, psaPrice: 12 }),
        entry(2, { change: -99, psaPrice: 45 }),
      ],
      { filters: filters(), period: "7d", grade: "psa_9" },
      "gain",
    );

    expect(result.map((item) => item.cardId)).toEqual([2, 1]);
  });

  it("ignores stale Raw-only filters after switching to a graded lens", () => {
    const result = filterEntries(
      [entry(1, { alert: false, change: -5, psaPrice: 45 })],
      {
        filters: filters({ direction: "up", hasAlert: true }),
        period: "7d",
        grade: "psa_10",
      },
    );

    expect(result.map((item) => item.cardId)).toEqual([1]);
  });

  it.each(["psa_10", "psa_9", "psa_8", "bgs_95"] as const)(
    "sorts the derived %s price and keeps missing anchors last",
    (grade) => {
      const priced = [
        entry(1, { psaPrice: 45 }),
        entry(2, { psaPrice: 12 }),
        entry(3, { psaPrice: null }),
      ];

      expect(
        sortEntries(priced, "priceHigh", "7d", grade).map(
          (item) => item.cardId,
        ),
      ).toEqual([1, 2, 3]);
      expect(
        sortEntries(priced, "priceLow", "7d", grade).map(
          (item) => item.cardId,
        ),
      ).toEqual([2, 1, 3]);
    },
  );
});

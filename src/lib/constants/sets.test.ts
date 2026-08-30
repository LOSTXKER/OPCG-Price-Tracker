import { describe, expect, it } from "vitest";

import {
  OPCG_SETS,
  getJapaneseSetReleaseDate,
  resolveSetReleaseDate,
} from "./sets";

/**
 * The set page, the set grid tiles and the "OPxx วางขายเมื่อไหร่" FAQ answer all
 * read this catalog — no `CardSet` row carries a release date today. An entry
 * that loses its date silently drops the whole row from the page instead of
 * failing loudly, so the completeness rule is locked here.
 */
describe("OPCG set release dates", () => {
  it("dates every real Bandai product", () => {
    const undated = OPCG_SETS.filter((set) => !set.releaseDate).map(
      (set) => set.code,
    );

    // `don` is our own bucket for DON!! cards, not a product Bandai shipped on
    // a street date — inventing one would put a fake fact on the page.
    expect(undated).toEqual(["don"]);
  });

  it("keeps every date a plain ISO day inside the game's lifetime", () => {
    // The game launched with ST-01..ST-04 on 2022-07-08 (OP-01 followed two
    // weeks later); nothing may predate that, and a typo that lands years out
    // would read on the page as a set that has not been released yet.
    const first = Date.parse("2022-07-08T00:00:00.000Z");
    const horizon = Date.parse("2030-01-01T00:00:00.000Z");

    for (const set of OPCG_SETS) {
      if (!set.releaseDate) continue;
      expect(set.releaseDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const parsed = Date.parse(`${set.releaseDate}T00:00:00.000Z`);
      expect(Number.isNaN(parsed)).toBe(false);
      expect(parsed).toBeGreaterThanOrEqual(first);
      expect(parsed).toBeLessThan(horizon);
    }
  });

  it("reads the catalog only when the database has no date", () => {
    expect(getJapaneseSetReleaseDate("OP02")).toBe("2022-11-04");
    expect(getJapaneseSetReleaseDate("don")).toBeNull();

    expect(resolveSetReleaseDate("op02", null)?.toISOString()).toBe(
      "2022-11-04T00:00:00.000Z",
    );

    const scraped = new Date("2022-11-05T00:00:00.000Z");
    expect(resolveSetReleaseDate("op02", scraped)).toBe(scraped);
    expect(resolveSetReleaseDate("don", null)).toBeNull();
  });
});

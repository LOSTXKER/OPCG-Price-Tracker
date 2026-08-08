import { describe, expect, it } from "vitest";

import { formatSnapshotDate, formatTierPriceLabel } from "./rarity-price-format";

/**
 * SEO round 3: the rarity tier price line moved from hand-typed "¥X-Y"
 * strings to a real min/max computed from `Card.latestPriceJpy` (see
 * `getRarityPriceStats` in page.tsx). These two pure formatters are the
 * only non-trivial logic in that change that doesn't require a DB — cover
 * the edge cases (no data yet, single-price tiers) directly.
 */
describe("formatTierPriceLabel", () => {
  it("falls back to the no-data copy when a tier has no priced cards", () => {
    for (const lang of ["TH", "EN", "JP"] as const) {
      const label = formatTierPriceLabel(lang, null);
      expect(label.length).toBeGreaterThan(0);
      expect(label).not.toContain("฿");
    }
  });

  it("renders a single price with no range when min equals max", () => {
    const label = formatTierPriceLabel("TH", { count: 1, minThb: 50, maxThb: 50 });
    expect(label).toBe("50 ฿");
  });

  it("renders a plain low–high range, no statistics vocabulary", () => {
    // Owner call เบส 2026-08-07: the median reading ("มัธยฐาน X ฿") was
    // statistics vocabulary collectors don't use — the range alone answers
    // "roughly what does this tier cost?".
    const label = formatTierPriceLabel("TH", { count: 115, minThb: 20, maxThb: 250000 });
    expect(label).toBe("20–250,000 ฿");
    expect(label).not.toContain("มัธยฐาน");
  });
});

describe("formatSnapshotDate", () => {
  it("returns null when there is no snapshot yet", () => {
    expect(formatSnapshotDate("TH", null)).toBeNull();
  });

  it("interpolates a real formatted date into the label", () => {
    const label = formatSnapshotDate("EN", "2026-04-05T00:00:00.000Z");
    expect(label).not.toBeNull();
    expect(label).toContain("2026");
  });
});

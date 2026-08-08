import { describe, expect, it } from "vitest";

import {
  buildCardFaq,
  buildCardIntro,
  buildCardSeoDescription,
  buildCardSeoTitle,
  buildPriceHistoryCopy,
  type CardSeoData,
} from "./card";

/**
 * Owner ruling (เบส, restated 2026-08-08 — "เอาออกไปเลย ทั้งเว็บ"): the internal
 * `_pN` / `_rN` printing suffix must not appear in any copy a reader sees.
 * Card pages are ~3,800 URLs, so a regression here is the widest possible one.
 *
 * These assertions are on the *output*, not on which helper was called — a
 * future edit that interpolates `data.cardCode` directly fails them.
 */
const parallel: CardSeoData = {
  cardCode: "OP09-001_p1",
  nameTh: "แชงคุส",
  nameLatin: "Shanks",
  rarity: "P-L",
  isParallel: true,
  setCode: "op09",
  setName: "Emperors in the New World",
  latestPriceJpy: 12_000,
  latestPriceThb: 2_800,
  priceChange30d: 12.5,
  priceScrapedAt: "2026-08-05T03:00:00.000Z",
};

const reprint: CardSeoData = {
  ...parallel,
  cardCode: "EB01-006_r1",
  nameTh: "ช็อปเปอร์",
  nameLatin: "Tony Tony.Chopper",
  rarity: "SR",
  isParallel: false,
};

/** Any `_p3` / `_r1` tail, anywhere in the string. */
const SUFFIX = /_[a-z]\d/i;

describe.each([
  ["parallel", parallel],
  ["reprint", reprint],
])("card copy never leaks the %s printing suffix", (_label, data) => {
  it.each(["TH", "EN"] as const)("title (%s)", (lang) => {
    expect(buildCardSeoTitle(lang, data)).not.toMatch(SUFFIX);
  });

  it.each(["TH", "EN"] as const)("meta description (%s)", (lang) => {
    expect(buildCardSeoDescription(lang, data)).not.toMatch(SUFFIX);
  });

  it.each(["TH", "EN"] as const)("on-page intro (%s)", (lang) => {
    for (const paragraph of buildCardIntro(lang, data)) {
      expect(paragraph).not.toMatch(SUFFIX);
    }
  });

  it.each(["TH", "EN"] as const)("FAQ questions and answers (%s)", (lang) => {
    for (const item of buildCardFaq(lang, data)) {
      expect(item.question).not.toMatch(SUFFIX);
      expect(item.answer).not.toMatch(SUFFIX);
    }
  });

  it.each(["TH", "EN"] as const)("price-history headings (%s)", (lang) => {
    const copy = buildPriceHistoryCopy(lang, {
      cardCode: data.cardCode,
      latestDate: "5 ส.ค. 2026",
      pointCount: 0,
    });
    expect(copy.title).not.toMatch(SUFFIX);
    expect(copy.lead).not.toMatch(SUFFIX);
  });
});

describe("the printed card number is still present", () => {
  it("keeps the base code in the Thai description and FAQ, so the query term survives", () => {
    expect(buildCardSeoDescription("TH", parallel)).toContain("OP09-001");
    expect(buildCardFaq("TH", parallel)[0].question).toContain("OP09-001");
  });

  it("keeps two printings of one number distinguishable in the title", () => {
    // ~3,800 card pages: two P-L prints of OP09-001 must not produce a
    // byte-identical <title>. The word "Parallel N" does that job without
    // publishing the raw suffix.
    const p2: CardSeoData = { ...parallel, cardCode: "OP09-001_p2" };
    expect(buildCardSeoTitle("TH", parallel)).not.toBe(buildCardSeoTitle("TH", p2));
  });
});

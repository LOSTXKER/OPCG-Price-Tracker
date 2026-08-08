import { describe, expect, it, vi } from "vitest";

// json-ld.ts reads NEXT_PUBLIC_APP_URL via clientEnv() at module load; mock
// it the same way src/proxy.test.ts does instead of requiring a real
// .env in the test environment.
vi.mock("@/lib/env", () => ({
  clientEnv: () => ({ NEXT_PUBLIC_APP_URL: "https://meecard.test" }),
}));

import { productJsonLd } from "./json-ld";
import { jpyToThb } from "@/lib/utils/currency";

const baseCard = {
  cardCode: "OP01-003",
  nameEn: "Monkey.D.Luffy",
  nameJp: "モンキー・D・ルフィ",
  nameTh: "มังกี้ ดี. ลูฟี่",
  rarity: "SR",
  imageUrl: "https://example.com/op01-003.png",
  latestPriceJpy: 2_100,
  latestPriceThb: null as number | null,
  priceScrapedAt: "2026-07-12T03:00:00.000Z",
  set: { nameEn: "Romance Dawn", name: "Romance Dawn", nameTh: null as string | null },
};

describe("productJsonLd offers.price", () => {
  it("uses the real DB THB price and priceCurrency THB when latestPriceThb is a positive number", () => {
    const data = productJsonLd({ ...baseCard, latestPriceThb: 450 });

    expect(data.offers).toBeDefined();
    expect(data.offers!.price).toBe(450);
    expect(data.offers!.priceCurrency).toBe("THB");
  });

  it("derives THB from JPY — same conversion the page shows — when latestPriceThb is null", () => {
    const data = productJsonLd({ ...baseCard, latestPriceThb: null });

    // Matches cardPriceThbText's fallback (copy/card.ts): Math.round(jpyToThb(jpy)).
    expect(data.offers!.price).toBe(Math.round(jpyToThb(2_100)));
    // Never JPY — the page always renders THB, so the structured data must
    // match what a visitor actually sees on screen.
    expect(data.offers!.priceCurrency).toBe("THB");
  });

  it("derives THB from JPY — never a ฿0 offer — when latestPriceThb is 0", () => {
    // `latestPriceThb: 0` is a real DB value (not "unset"); `??` used to let
    // it through as a false ฿0 offer.
    const data = productJsonLd({ ...baseCard, latestPriceThb: 0 });

    expect(data.offers!.price).toBe(Math.round(jpyToThb(2_100)));
    expect(data.offers!.price).toBeGreaterThan(0);
    expect(data.offers!.priceCurrency).toBe("THB");
  });

  it("emits no offers at all when neither THB nor JPY has a usable price", () => {
    const data = productJsonLd({ ...baseCard, latestPriceThb: null, latestPriceJpy: null });

    expect(data.offers).toBeUndefined();
  });

  it("emits no offers when JPY is also 0/negative-equivalent missing state", () => {
    const data = productJsonLd({ ...baseCard, latestPriceThb: 0, latestPriceJpy: null });

    expect(data.offers).toBeUndefined();
  });
});

describe("productJsonLd never publishes the internal printing suffix", () => {
  // Owner ruling: `_p3`/`_r1` is our scraper's key for separating printings,
  // not a number Bandai prints. It belongs in `url`/`sku` (identifiers) and
  // nowhere a human or a rich result reads. See @/lib/cards/card-code.
  const parallel = { ...baseCard, cardCode: "OP09-001_p1" };

  it("keeps the suffix out of `name` and `description`", () => {
    const data = productJsonLd(parallel);

    expect(data.name).not.toMatch(/_p\d/i);
    expect(data.description).not.toMatch(/_p\d/i);
    expect(data.name).toContain("OP09-001");
    expect(data.description).toContain("(OP09-001)");
  });

  it("still keeps the full code in `sku` and `url` — those are addresses", () => {
    const data = productJsonLd(parallel);

    expect(data.sku).toBe("OP09-001_p1");
    expect(data.url).toBe("https://meecard.test/opcg/cards/OP09-001_p1");
    expect(data.offers!.url).toBe("https://meecard.test/opcg/cards/OP09-001_p1");
  });

  it("strips a reprint suffix too", () => {
    const data = productJsonLd({ ...baseCard, cardCode: "EB01-006_r1" });

    expect(data.name).not.toMatch(/_r\d/i);
    expect(data.description).not.toMatch(/_r\d/i);
  });
});

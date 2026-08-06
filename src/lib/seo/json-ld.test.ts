import { describe, expect, it, vi } from "vitest";

// json-ld.ts reads NEXT_PUBLIC_APP_URL via clientEnv() at module load; mock
// it the same way src/middleware.test.ts does instead of requiring a real
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

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  TrendingMoversSections,
  TrendingWorthCollectingSection,
} from "./trending-movers-sections";
import type { TrendingCardRow } from "./page";

function card(overrides: Partial<TrendingCardRow> = {}): TrendingCardRow {
  return {
    cardCode: "OP01-003",
    baseCode: "OP01-003",
    nameJp: "モンキー・D・ルフィ",
    nameEn: "Monkey D. Luffy",
    nameTh: "มังกี้ ดี. ลูฟี่",
    rarity: "SEC",
    isParallel: false,
    imageUrl: null,
    latestPriceJpy: 12_000,
    priceChange24h: 8.25,
    priceChange7d: 12.5,
    priceChange30d: -3.75,
    viewCount: 10,
    setCode: "op01",
    sparkline: [],
    ...overrides,
  };
}

describe("TrendingMoversSections", () => {
  it("emits every section as server HTML — no hooks, no fetch", () => {
    const markup = renderToStaticMarkup(
      <TrendingMoversSections
        lang="TH"
        sections={[
          { period: "24h", kind: "losers", cards: [card({ priceChange24h: -8.25 })] },
          { period: "7d", kind: "gainers", cards: [card({ cardCode: "OP02-013" })] },
          { period: "30d", kind: "gainers", cards: [card({ cardCode: "OP03-003" })] },
        ]}
      />,
    );

    expect(markup.match(/<h2/g)).toHaveLength(3);
  });

  // The first block is losers-24h, not gainers-24h — it must not duplicate the
  // default gainers-24h tab table rendered above it (TrendingTabs), and
  // "ราคาลง" needs to actually be present in the server HTML since the meta
  // description promises both directions.
  it("leads with losers 24h, then gainers 7d and 30d — not three gainers windows", () => {
    const markup = renderToStaticMarkup(
      <TrendingMoversSections
        lang="TH"
        sections={[
          { period: "24h", kind: "losers", cards: [card({ priceChange24h: -8.25 })] },
          { period: "7d", kind: "gainers", cards: [card({ cardCode: "OP02-013" })] },
          { period: "30d", kind: "gainers", cards: [card({ cardCode: "OP03-003" })] },
        ]}
      />,
    );

    expect(markup).toContain("ราคาลงแรงสุด 24 ชั่วโมง");
    expect(markup).toContain("ราคาขึ้นแรงสุด 7 วัน");
    expect(markup).toContain("ราคาขึ้นแรงสุด 30 วัน");
    expect(markup).not.toContain("ราคาขึ้นแรงสุด 24 ชั่วโมง");
  });

  it("renders the Thai card name, the code and a THB price per row", () => {
    const markup = renderToStaticMarkup(
      <TrendingMoversSections
        lang="TH"
        sections={[{ period: "24h", kind: "losers", cards: [card({ priceChange24h: -8.25 })] }]}
      />,
    );

    expect(markup).toContain("มังกี้ ดี. ลูฟี่");
    expect(markup).toContain("OP01-003");
    expect(markup).toContain("/opcg/cards/OP01-003");
    expect(markup).toContain("฿");
    expect(markup).toContain("-8.25%");
  });

  it("uses the period's own change column", () => {
    const markup = renderToStaticMarkup(
      <TrendingMoversSections
        lang="TH"
        sections={[{ period: "30d", kind: "gainers", cards: [card()] }]}
      />,
    );

    expect(markup).toContain("-3.75%");
    expect(markup).not.toContain("+8.25%");
  });
});

// "การ์ดวันพีซ น่าเก็บ / น่าลงทุน" search intent (SEO round 3) had zero
// coverage anywhere on this page before this section — lock the keywords,
// the H2, the link to /opcg/most-expensive and the disclaimer in server HTML.
describe("TrendingWorthCollectingSection", () => {
  it("renders as server HTML with an H2 carrying the target keywords", () => {
    const markup = renderToStaticMarkup(<TrendingWorthCollectingSection lang="TH" />);

    expect(markup).toContain("<h2");
    expect(markup).toContain("น่าเก็บ");
    expect(markup).toContain("น่าลงทุน");
  });

  it("links to the most-expensive page and states it is not investment advice", () => {
    const markup = renderToStaticMarkup(<TrendingWorthCollectingSection lang="TH" />);

    expect(markup).toContain('href="/opcg/most-expensive"');
    expect(markup).toContain("ไม่ใช่คำแนะนำการลงทุน");
  });
});

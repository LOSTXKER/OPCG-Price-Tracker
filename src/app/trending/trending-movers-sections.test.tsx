import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { TrendingMoversSections } from "./trending-movers-sections";
import type { TrendingCardRow } from "./page";

function card(overrides: Partial<TrendingCardRow> = {}): TrendingCardRow {
  return {
    cardCode: "OP01-003",
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
  it("emits every period section as server HTML — no hooks, no fetch", () => {
    const markup = renderToStaticMarkup(
      <TrendingMoversSections
        lang="TH"
        sections={[
          { period: "24h", cards: [card()] },
          { period: "7d", cards: [card({ cardCode: "OP02-013" })] },
          { period: "30d", cards: [card({ cardCode: "OP03-003" })] },
        ]}
      />,
    );

    expect(markup).toContain("ราคาขึ้นแรงสุด 24 ชั่วโมง");
    expect(markup).toContain("ราคาขึ้นแรงสุด 7 วัน");
    expect(markup).toContain("ราคาขึ้นแรงสุด 30 วัน");
    expect(markup.match(/<h2/g)).toHaveLength(3);
  });

  it("renders the Thai card name, the code and a THB price per row", () => {
    const markup = renderToStaticMarkup(
      <TrendingMoversSections lang="TH" sections={[{ period: "24h", cards: [card()] }]} />,
    );

    expect(markup).toContain("มังกี้ ดี. ลูฟี่");
    expect(markup).toContain("OP01-003");
    expect(markup).toContain("/opcg/cards/OP01-003");
    expect(markup).toContain("฿");
    expect(markup).toContain("+8.25%");
  });

  it("uses the period's own change column", () => {
    const markup = renderToStaticMarkup(
      <TrendingMoversSections lang="TH" sections={[{ period: "30d", cards: [card()] }]} />,
    );

    expect(markup).toContain("-3.75%");
    expect(markup).not.toContain("+8.25%");
  });
});

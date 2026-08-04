import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  SearchBrowseBlocks,
  SearchSsrResults,
  type SsrSearchCard,
  type SsrSearchSet,
} from "./search-seo-blocks";

const cards: SsrSearchCard[] = [
  {
    cardCode: "OP13-118",
    nameJp: "モンキー・D・ルフィ",
    nameEn: "Monkey D. Luffy",
    nameTh: "มังกี้ ดี. ลูฟี่",
    rarity: "SEC",
    latestPriceJpy: 24_000,
    imageUrl: null,
    setCode: "op13",
  },
];

const sets: SsrSearchSet[] = [
  { code: "OP13", name: "ロマンスドーン", nameEn: "Royal Blood", releaseDate: "2026-05-01" },
];

describe("search SEO blocks", () => {
  it("renders results as server HTML: name, code, set and a THB price", () => {
    const markup = renderToStaticMarkup(
      <SearchSsrResults lang="TH" query="ลูฟี่" total={42} cards={cards} />,
    );

    expect(markup).toContain("ผลการค้นหา");
    expect(markup).toContain("42");
    expect(markup).toContain("มังกี้ ดี. ลูฟี่");
    expect(markup).toContain("OP13-118");
    expect(markup).toContain("OP13");
    expect(markup).toContain("/opcg/cards/OP13-118");
    expect(markup).toContain("฿");
  });

  it("renders crawlable browse scaffolding for the empty state", () => {
    const markup = renderToStaticMarkup(<SearchBrowseBlocks lang="TH" sets={sets} />);

    expect(markup).toContain("ชุดการ์ดล่าสุด");
    expect(markup).toContain("คำค้นยอดนิยม");
    // Set names stay English (CardSet.nameTh is NULL for every set) wrapped in
    // Thai context copy.
    expect(markup).toContain("Royal Blood");
    expect(markup).toContain("/opcg/sets/op13");
    expect(markup).toContain("/opcg/search?q=Luffy");
    expect(markup).toContain("/opcg/sets");
  });
});

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SetHero } from "./set-hero";
import { SetDropRateTable, toDropRateRows } from "./set-drop-rate-table";
import type { CardData, RarityGroup } from "./set-detail-content";
import {
  buildSetDetailMeta,
  buildSetFaq,
  buildSetIntro,
  buildSetsIndexIntro,
  rarityHeadingLabel,
  setTypeHeading,
  type SetSeoData,
} from "@/lib/seo/copy/sets";

function card(id: number, overrides: Partial<CardData> = {}): CardData {
  return {
    id,
    cardCode: `OP01-00${id}`,
    nameJp: `カード ${id}`,
    nameEn: `Card ${id}`,
    nameTh: `การ์ดทดสอบ ${id}`,
    rarity: "SEC",
    isParallel: false,
    imageUrl: null,
    latestPriceJpy: id * 1_000,
    latestPriceThb: null,
    priceChange24h: null,
    priceChange7d: null,
    priceChange30d: null,
    setCode: "op01",
    psa10PriceUsd: null,
    cardType: "CHARACTER",
    color: "Red",
    ...overrides,
  };
}

const groups: RarityGroup[] = [
  {
    rarity: "SEC",
    name: "Secret Rare",
    cards: [card(1), card(2)],
    pullRate: { rarity: "SEC", avgPerBox: 0.33, ratePerPack: 0.0138 },
    pullChancePerBox: 0.165,
  },
  {
    rarity: "SR",
    name: "Super Rare",
    cards: [card(3, { rarity: "SR" })],
    pullRate: { rarity: "SR", avgPerBox: 3, ratePerPack: 0.125 },
    pullChancePerBox: 0.95,
  },
];

const seo: SetSeoData = {
  code: "op01",
  name: "Romance Dawn",
  type: "BOOSTER",
  releaseDate: new Date("2022-12-02T00:00:00.000Z"),
  cardCount: 121,
  packsPerBox: 24,
  cardsPerPack: 6,
  rarities: [
    { rarity: "SEC", name: "Secret Rare", count: 2, avgPerBox: 0.33, chancePerBoxPerCard: 0.165 },
    { rarity: "SR", name: "Super Rare", count: 9, avgPerBox: 3, chancePerBoxPerCard: 0.3 },
  ],
  topCard: {
    name: "มังกี้ ดี. ลูฟี่",
    cardCode: "OP01-003",
    rarity: "SEC",
    priceJpy: 30_000,
  },
};

describe("set-detail SEO surface", () => {
  it("puts the set name inside the single visible h1", () => {
    const markup = renderToStaticMarkup(
      <SetHero
        lang="TH"
        code="op01"
        name="Romance Dawn"
        type="BOOSTER PACK"
        releaseDate={null}
        boxImage={null}
        cardCount={121}
        rarityGroups={groups}
        packsPerBox={24}
        cardsPerPack={6}
        hasDropRates={false}
        grade="raw"
      />,
    );

    const h1 = markup.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    expect(h1).not.toBeNull();
    expect(h1![1]).toContain("OP01");
    expect(h1![1]).toContain("Romance Dawn");
    expect(markup.match(/<h1/g)).toHaveLength(1);
  });

  it("renders drop-rate rows as crawlable HTML (no dialog required)", () => {
    const rows = toDropRateRows(groups);
    expect(rows).toHaveLength(2);

    const markup = renderToStaticMarkup(
      <SetDropRateTable
        lang="TH"
        code="op01"
        rows={rows}
        packsPerBox={24}
        cardsPerPack={6}
      />,
    );

    expect(markup).toContain("<table");
    expect(markup).toContain("อัตราออกการ์ด (Drop Rate) ของ OP01");
    // Both rarities, with their Thai gloss, are in the first HTML response.
    expect(markup).toContain("ซีเคร็ทแรร์");
    expect(markup).toContain("ซูเปอร์แรร์");
    expect(markup).toContain("~0.33");
    expect(markup).toContain("/opcg/drop-calculator");
    // Nothing here is behind a dialog / details toggle.
    expect(markup).not.toContain("role=\"dialog\"");
  });
});

describe("set SEO copy", () => {
  it("builds a Thai title within budget and covers both Thai spellings", () => {
    const { title, description } = buildSetDetailMeta("TH", seo);

    expect(title).toBe("ราคาการ์ดวันพีซ OP01 Romance Dawn ทุกใบ อัปเดตทุกวัน");
    expect(title.length).toBeLessThanOrEqual(60);
    expect(title).toContain("วันพีซ");
    expect(description).toContain("วันพีช");
    expect(description).toContain("121");
    expect(description).toContain("มังกี้ ดี. ลูฟี่");
    // THB is derived from JPY (latestPriceThb is NULL in production).
    // Owner ruling 2026-08-06 ("ไม่เอาเยน"): baht only, never yen, in copy.
    expect(description).toContain("฿");
    expect(description).not.toContain("¥");
  });

  it("clamps the title when the set name is long", () => {
    const long = buildSetDetailMeta("TH", {
      ...seo,
      code: "prb01",
      name: "PREMIUM BOOSTER -ONE PIECE CARD THE BEST-",
    });
    expect(long.title.length).toBeLessThanOrEqual(60);
    expect(long.title).toContain("PRB01");
  });

  it("generates ONE short keyword sentence, no data dump", () => {
    const paragraphs = buildSetIntro("TH", seo);
    // Owner ruling เบส 2026-08-07: the intro restated facts already visible
    // on the page (top card in the hero, rarity split in the wall headings,
    // box config in the drop-rate section) and read as a dump. Only what a
    // reader needs at this point survives.
    expect(paragraphs).toHaveLength(1);
    const text = paragraphs.join(" ");
    expect(text).toContain("2 ธ.ค. 2022");
    expect(text).toContain("121 ใบ");
    expect(text).toContain("วันพีช");
    // Facts the page already shows must NOT be restated here.
    expect(text).not.toContain("SEC 2 ใบ");
    expect(text).not.toContain("24 ซอง");
    expect(text).not.toContain("OP01-003");
  });

  it("answers the per-set FAQ from existing fields", () => {
    const faq = buildSetFaq("TH", seo);
    const questions = faq.map((item) => item.question);

    expect(questions).toContain("กล่อง OP01 มีกี่ซอง ซองละกี่ใบ");
    expect(questions).toContain("การ์ดที่แพงที่สุดใน OP01 คือใบไหน");
    expect(questions).toContain("OP01 วางขายเมื่อไหร่");
    expect(questions).toContain("โอกาสได้ SEC ต่อกล่องของ OP01 เท่าไหร่");
    expect(faq.every((item) => item.answer.length > 40)).toBe(true);
  });

  it("labels rarity + set-type headings in Thai as well as English", () => {
    expect(rarityHeadingLabel("TH", "SEC", "Secret Rare")).toBe(
      "Secret Rare (ซีเคร็ทแรร์)",
    );
    expect(rarityHeadingLabel("TH", "P-SR", "Parallel Super Rare")).toBe(
      "Parallel Super Rare (พาราเรลซูเปอร์แรร์)",
    );
    expect(rarityHeadingLabel("EN", "SEC", "Secret Rare")).toBe("Secret Rare");
    expect(setTypeHeading("TH", "BOOSTER")).toBe("บูสเตอร์ (Booster Pack)");
    expect(setTypeHeading("EN", "STARTER")).toBe("Starter Deck");
  });

  it("writes the set-index intro from live counts", () => {
    const text = buildSetsIndexIntro("TH", {
      setCount: 51,
      cardCount: 3838,
      latest: {
        code: "op12",
        name: "Legacy of the Master",
        releaseDate: "2025-06-13T00:00:00.000Z",
      },
    }).join(" ");

    expect(text).toContain("51 ชุด");
    expect(text).toContain("3,838 ใบ");
    expect(text).toContain("OP12 Legacy of the Master");
    expect(text).toContain("13 มิ.ย. 2025");
    expect(text).toContain("วันพีช");
  });
});

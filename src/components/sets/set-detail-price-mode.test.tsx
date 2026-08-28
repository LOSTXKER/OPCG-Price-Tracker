import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";

import {
  getRarityScrollBehavior,
  getVisibleSetGroups,
  SetDetailContent,
  type CardData,
  type RarityGroup,
} from "./set-detail-content";
import { SetCardTile } from "./set-card-tile";
import { getSetHighestGradeCard, SetHero } from "./set-hero";
import {
  formatByCurrency,
  formatUsdByCurrency,
} from "@/lib/utils/currency";
import { t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";

function card(
  id: number,
  overrides: Partial<CardData> = {},
): CardData {
  return {
    id,
    cardCode: `OP03-00${id}`,
    nameJp: `カード ${id}`,
    nameEn: `Card ${id}`,
    // Thai names ship in the projection now — the TH default must render them.
    nameTh: `การ์ดทดสอบ ${id}`,
    rarity: "SR",
    isParallel: false,
    imageUrl: null,
    latestPriceJpy: id * 1_000,
    latestPriceThb: id * 250,
    priceChange24h: 1,
    priceChange7d: 2,
    priceChange30d: 3,
    setCode: "op03",
    psa10PriceUsd: null,
    cardType: "CHARACTER",
    color: "Red",
    ...overrides,
  };
}

function group(cards: CardData[]): RarityGroup {
  return { rarity: "SR", name: "Super Rare", cards };
}

beforeEach(() => {
  useUIStore.setState({ language: "TH", currency: "THB" });
});

describe("set-detail grade lens", () => {
  it("keeps rarity motion short and honors reduced-motion", () => {
    expect(getRarityScrollBehavior(800, 844, false)).toBe("smooth");
    expect(getRarityScrollBehavior(1_700, 844, false)).toBe("auto");
    expect(getRarityScrollBehavior(100, 844, true)).toBe("auto");
  });

  it("keeps both mobile control rows in one sticky group without shrinking touch targets", () => {
    const groups = [
      group([
        card(1, { color: "Red", cardType: "CHARACTER" }),
        card(2, { color: "Blue", cardType: "EVENT" }),
      ]),
    ];
    const markup = renderToStaticMarkup(
      <SetDetailContent
        groups={groups}
        totalCards={2}
        grade="raw"
        onGradeChange={() => undefined}
      />,
    );

    const stickyIndex = markup.indexOf('data-slot="set-rarity-nav-sticky"');
    const gradeIndex = markup.indexOf('data-slot="set-mobile-grade-row"');
    const compactControlsIndex = markup.indexOf(
      'data-slot="set-mobile-control-row"',
    );
    expect(stickyIndex).toBeGreaterThan(-1);
    expect(gradeIndex).toBeGreaterThan(stickyIndex);
    expect(compactControlsIndex).toBeGreaterThan(gradeIndex);
    expect(markup).toContain(
      "sticky top-[var(--chrome-h)] z-sticky",
    );
    const mobileGradeRow = markup.slice(gradeIndex, compactControlsIndex);
    expect(mobileGradeRow).toContain("sm:w-full");
    expect(mobileGradeRow).not.toContain("sm:w-56");
    expect(markup).toContain(`aria-label="${t("TH", "pricePeriod")}"`);
    expect(markup).toContain(`aria-label="${t("TH", "rarity")}"`);
    expect(markup).toContain(`aria-label="${t("TH", "filter")}"`);
    expect(markup).toContain("sm:min-h-11!");
  });

  it("offers a recovery action when grade filtering removes every card", () => {
    const markup = renderToStaticMarkup(
      <SetDetailContent
        groups={[group([card(1, { psa10PriceUsd: null })])]}
        totalCards={1}
        grade="psa_10"
        onGradeChange={() => undefined}
      />,
    );

    expect(markup).toContain(t("TH", "noData"));
    expect(markup).toContain(t("TH", "clearAllFilters"));
  });

  it("keeps Raw order but limits graded tiers to PSA-anchored cards", () => {
    const cards = [
      card(1, { psa10PriceUsd: 40 }),
      card(2, { psa10PriceUsd: null }),
      card(3, { psa10PriceUsd: 90 }),
    ];
    const groups = [group(cards)];

    expect(
      getVisibleSetGroups(groups, {
        activeType: "all",
        activeColor: "all",
        grade: "raw",
      }),
    ).toBe(groups);

    const psa = getVisibleSetGroups(groups, {
      activeType: "all",
      activeColor: "all",
      grade: "psa_10",
    });

    expect(psa[0]?.cards.map((item) => item.id)).toEqual([3, 1]);
    expect(groups[0]?.cards.map((item) => item.id)).toEqual([1, 2, 3]);
  });

  it("combines type and color facets with PSA availability", () => {
    const groups = [
      group([
        card(1, { psa10PriceUsd: 40, color: "Red", cardType: "CHARACTER" }),
        card(2, { psa10PriceUsd: 80, color: "Blue", cardType: "CHARACTER" }),
        card(3, { psa10PriceUsd: 90, color: "Red", cardType: "EVENT" }),
      ]),
    ];

    const result = getVisibleSetGroups(groups, {
      activeType: "CHARACTER",
      activeColor: "Red",
      grade: "psa_9",
    });

    expect(result[0]?.cards.map((item) => item.id)).toEqual([1]);
  });

  it("renders Raw with its change and PSA without Raw-only change data", () => {
    const priced = card(1, { psa10PriceUsd: 100 });
    const rawMarkup = renderToStaticMarkup(
      <SetCardTile card={priced} changePeriod="7d" grade="raw" />,
    );
    const psaMarkup = renderToStaticMarkup(
      <SetCardTile card={priced} changePeriod="7d" grade="psa_10" />,
    );

    expect(rawMarkup).toContain(
      formatByCurrency(1_000, "THB", 250).primary,
    );
    expect(rawMarkup).toContain('aria-label="การ์ดทดสอบ 1"');
    expect(rawMarkup).not.toContain("Card 1");
    expect(rawMarkup).toContain("+2.0%");
    const psaPrice = formatUsdByCurrency(100, "THB").primary;
    expect(psaMarkup).toContain(psaPrice);
    expect(psaMarkup).toContain(
      `aria-label="การ์ดทดสอบ 1, PSA 10, ${psaPrice}"`,
    );
    expect(psaMarkup).not.toContain("+2.0%");
  });

  it("derives modeled grades from PSA 10 without an estimate badge", () => {
    const priced = card(1, { psa10PriceUsd: 100 });
    const markup = renderToStaticMarkup(
      <SetCardTile card={priced} changePeriod="7d" grade="psa_9" />,
    );

    expect(markup).toContain(formatUsdByCurrency(50, "THB").primary);
    expect(markup).not.toContain("est.");
    expect(markup).not.toContain("ราคาตัวอย่าง");
    expect(markup).not.toContain("+2.0%");
  });

  it("resolves the set leader from the selected grade", () => {
    const groups = [
      group([
        card(1, {
          cardCode: "OP03-001_p2",
          latestPriceJpy: 1_000,
          psa10PriceUsd: 100,
        }),
        card(2, {
          imageUrl: "/cards/op03-002.webp",
          latestPriceJpy: 5_000,
          latestPriceThb: 1_250,
          psa10PriceUsd: 40,
        }),
      ]),
    ];

    expect(getSetHighestGradeCard(groups, "raw")?.card.id).toBe(2);
    expect(getSetHighestGradeCard(groups, "psa_10")?.card.id).toBe(1);
    expect(getSetHighestGradeCard(groups, "bgs_95")).toMatchObject({
      card: { id: 1 },
      price: { amount: 115, currency: "USD", dataKind: "modeled" },
    });
  });

  it("renders the hero summary from the selected grade without estimate copy", () => {
    const groups = [
      group([
        card(1, {
          cardCode: "OP03-001_p2",
          latestPriceJpy: 1_000,
          psa10PriceUsd: 100,
        }),
        card(2, {
          imageUrl: "/cards/op03-002.webp",
          latestPriceJpy: 5_000,
          latestPriceThb: 1_250,
          psa10PriceUsd: 40,
        }),
      ]),
    ];
    const common = {
      lang: "TH" as const,
      code: "op03",
      name: "Pillars of Strength",
      type: "BOOSTER PACK",
      releaseDate: null,
      boxImage: null,
      cardCount: 2,
      rarityGroups: groups,
      packsPerBox: null,
      cardsPerPack: null,
      hasDropRates: false,
    };

    const rawMarkup = renderToStaticMarkup(
      <SetHero {...common} grade="raw" />,
    );
    const bgsMarkup = renderToStaticMarkup(
      <SetHero {...common} grade="bgs_95" />,
    );

    expect(rawMarkup).toContain("มูลค่าสูงสุด · Raw");
    expect(rawMarkup).toContain('href="/opcg/cards/OP03-002"');
    expect(rawMarkup).toContain(
      formatByCurrency(5_000, "THB", 1_250).primary,
    );
    expect(rawMarkup).not.toContain("est.");
    expect(rawMarkup).toContain('<img alt=""');
    expect(rawMarkup).toContain(
      '<span class="sr-only">OP03-002 การ์ดทดสอบ 2</span>',
    );
    expect(rawMarkup).toContain("min-h-11");
    expect(rawMarkup).toContain("การ์ด");
    expect(rawMarkup).not.toContain("การ์ดทั้งหมด");
    expect(rawMarkup).not.toContain("หมายเลขการ์ด");
    expect(rawMarkup).not.toContain("เวอร์ชันพิเศษ");
    expect(rawMarkup).not.toContain("เวอร์ชันทั้งหมด");

    expect(bgsMarkup).toContain("มูลค่าสูงสุด · BGS 9.5");
    expect(bgsMarkup).toContain('href="/opcg/cards/OP03-001_p2"');
    expect(bgsMarkup).toContain("OP03-001");
    expect(bgsMarkup).not.toContain(">OP03-001_p2<");
    expect(bgsMarkup).toContain(formatUsdByCurrency(115, "THB").primary);
    expect(bgsMarkup).not.toContain("est.");
    expect(bgsMarkup).not.toContain("ราคาตัวอย่าง");
  });
});

import { describe, expect, it } from "vitest";

import type { PriceAlertItem } from "@/components/alerts/alert-types";

import { filterAlertsBySearch, sortAlertsByUrgency } from "./alerts-sort";

function alert(
  id: number,
  overrides: {
    direction?: "ABOVE" | "BELOW";
    targetPrice?: number;
    currentPriceJpy?: number | null;
    nameEn?: string | null;
    nameJp?: string;
    nameTh?: string | null;
    cardCode?: string;
  } = {},
): PriceAlertItem {
  return {
    id,
    userId: "user-1",
    cardId: id,
    targetPrice: overrides.targetPrice ?? 1000,
    direction: overrides.direction ?? "ABOVE",
    channels: ["EMAIL"],
    isActive: true,
    triggeredAt: null,
    createdAt: "2026-07-01T00:00:00.000Z",
    card: {
      id,
      cardCode: overrides.cardCode ?? `OP01-00${id}`,
      baseCode: null,
      nameJp: overrides.nameJp ?? `カード ${id}`,
      nameEn: overrides.nameEn ?? `Card ${id}`,
      nameTh: overrides.nameTh ?? null,
      rarity: "SR",
      imageUrl: null,
      latestPriceJpy: overrides.currentPriceJpy === undefined ? 1000 : overrides.currentPriceJpy,
      latestPriceThb: null,
      set: null,
    },
  };
}

describe("sortAlertsByUrgency", () => {
  it("sorts closest-to-target first for ABOVE alerts", () => {
    const near = alert(1, { direction: "ABOVE", targetPrice: 1100, currentPriceJpy: 1000 }); // 10% away
    const far = alert(2, { direction: "ABOVE", targetPrice: 2000, currentPriceJpy: 1000 }); // 100% away

    const sorted = sortAlertsByUrgency([far, near]);

    expect(sorted.map((a) => a.id)).toEqual([1, 2]);
  });

  it("sorts closest-to-target first for BELOW alerts", () => {
    const near = alert(1, { direction: "BELOW", targetPrice: 900, currentPriceJpy: 1000 }); // 10% away
    const far = alert(2, { direction: "BELOW", targetPrice: 100, currentPriceJpy: 1000 }); // 90% away

    const sorted = sortAlertsByUrgency([far, near]);

    expect(sorted.map((a) => a.id)).toEqual([1, 2]);
  });

  it("sorts alerts already past their target first", () => {
    const pastTarget = alert(1, { direction: "ABOVE", targetPrice: 900, currentPriceJpy: 1000 }); // gap <= 0
    const notYet = alert(2, { direction: "ABOVE", targetPrice: 1100, currentPriceJpy: 1000 });

    const sorted = sortAlertsByUrgency([notYet, pastTarget]);

    expect(sorted.map((a) => a.id)).toEqual([1, 2]);
  });

  it("sorts alerts with no current price last", () => {
    const noPrice = alert(1, { currentPriceJpy: null });
    const withPrice = alert(2, { direction: "ABOVE", targetPrice: 2000, currentPriceJpy: 1000 });

    const sorted = sortAlertsByUrgency([noPrice, withPrice]);

    expect(sorted.map((a) => a.id)).toEqual([2, 1]);
  });

  it("does not mutate the input array", () => {
    const list = [alert(1), alert(2)];
    const original = [...list];

    sortAlertsByUrgency(list);

    expect(list).toEqual(original);
  });
});

describe("filterAlertsBySearch", () => {
  const alerts = [
    alert(1, { nameEn: "Monkey D. Luffy", nameTh: null, cardCode: "OP01-001" }),
    alert(2, { nameEn: "Roronoa Zoro", nameTh: "โซโร", cardCode: "OP01-002" }),
  ];

  it("matches by English name", () => {
    expect(filterAlertsBySearch(alerts, "EN", "luffy").map((a) => a.id)).toEqual([1]);
  });

  it("matches by Thai name", () => {
    expect(filterAlertsBySearch(alerts, "TH", "โซโร").map((a) => a.id)).toEqual([2]);
  });

  it("matches by card code", () => {
    expect(filterAlertsBySearch(alerts, "EN", "op01-002").map((a) => a.id)).toEqual([2]);
  });

  it("returns everything for an empty query", () => {
    expect(filterAlertsBySearch(alerts, "EN", "  ")).toHaveLength(2);
  });
});

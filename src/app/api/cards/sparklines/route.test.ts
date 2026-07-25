import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  groupBy: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    cardPrice: {
      findMany: mocks.findMany,
      groupBy: mocks.groupBy,
    },
  },
}));

import { GET } from "./route";

describe("card sparkline route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-20T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("anchors each card to its latest Raw snapshot even when the data is stale", async () => {
    const dailyPrices = Array.from({ length: 30 }, (_, index) => ({
      cardId: 1,
      priceJpy: 1_000 + index,
      scrapedAt: new Date(Date.UTC(2026, 2, 7 + index, 9)),
    }));
    mocks.groupBy.mockResolvedValue([
      {
        cardId: 1,
        _max: { scrapedAt: new Date("2026-04-05T18:00:00.000Z") },
      },
      {
        cardId: 2,
        _max: { scrapedAt: new Date("2026-02-01T10:00:00.000Z") },
      },
    ]);
    mocks.findMany.mockResolvedValue([
      {
        cardId: 2,
        priceJpy: 777,
        scrapedAt: new Date("2026-02-01T10:00:00.000Z"),
      },
      dailyPrices[0],
      {
        cardId: 1,
        priceJpy: 1_999,
        scrapedAt: new Date("2026-03-07T18:00:00.000Z"),
      },
      ...dailyPrices.slice(1),
      {
        cardId: 1,
        priceJpy: 2_029,
        scrapedAt: new Date("2026-04-05T18:00:00.000Z"),
      },
    ]);

    const response = await GET(
      new NextRequest(
        "https://meecard.test/api/cards/sparklines?ids=1,2,2,invalid",
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.groupBy).toHaveBeenCalledWith({
      by: ["cardId"],
      where: {
        cardId: { in: [1, 2] },
        source: "YUYUTEI",
        type: "SELL",
        gradeCondition: null,
        priceJpy: { not: null },
      },
      _max: { scrapedAt: true },
    });
    expect(mocks.findMany).toHaveBeenCalledWith({
      where: {
        source: "YUYUTEI",
        type: "SELL",
        gradeCondition: null,
        priceJpy: { not: null },
        OR: [
          {
            cardId: 1,
            scrapedAt: {
              gte: new Date("2026-03-06T18:00:00.000Z"),
              lte: new Date("2026-04-05T18:00:00.000Z"),
            },
          },
          {
            cardId: 2,
            scrapedAt: {
              gte: new Date("2026-01-02T10:00:00.000Z"),
              lte: new Date("2026-02-01T10:00:00.000Z"),
            },
          },
        ],
      },
      orderBy: [{ scrapedAt: "asc" }, { id: "asc" }],
      select: {
        cardId: true,
        priceJpy: true,
        scrapedAt: true,
      },
    });

    expect(body).toEqual({
      sparklines: {
        1: [
          1_999,
          ...dailyPrices.slice(1, -1).map((price) => price.priceJpy),
          2_029,
        ],
        2: [777],
      },
    });
    expect(body.sparklines[1]).toHaveLength(30);
    expect(body.sparklines[1][0]).toBe(1_999);
    expect(body.sparklines[1].at(-1)).toBe(2_029);
  });

  it("returns an empty series without a history query when no latest snapshot exists", async () => {
    mocks.groupBy.mockResolvedValue([
      { cardId: 1, _max: { scrapedAt: null } },
    ]);

    const response = await GET(
      new NextRequest(
        "https://meecard.test/api/cards/sparklines?ids=1,2",
      ),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ sparklines: {} });
    expect(mocks.findMany).not.toHaveBeenCalled();
  });
});

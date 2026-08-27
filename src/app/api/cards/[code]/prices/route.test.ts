import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuthUser: vi.fn(),
  findCardByCode: vi.fn(),
  findFirst: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock("@/lib/api/auth", () => ({
  getAuthUser: mocks.getAuthUser,
}));

vi.mock("@/lib/data/card-detail", () => ({
  findCardByCode: mocks.findCardByCode,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    cardPrice: {
      findFirst: mocks.findFirst,
      findMany: mocks.findMany,
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  createLog: () => ({ error: vi.fn() }),
}));

import { GET } from "./route";

const latestAt = new Date("2026-04-05T03:00:00.000Z");
const context = {
  params: Promise.resolve({ code: "OP13-118_p3" }),
};
const storedPrice = {
  id: 1,
  source: "YUYUTEI",
  type: "SELL",
  priceJpy: 268_800,
  priceThb: 61_824,
  priceUsd: null,
  priceEur: null,
  inStock: true,
  gradeCondition: null,
  scrapedAt: latestAt,
};

function request(query = "period=all&source=YUYUTEI&grade=raw") {
  return new NextRequest(
    `https://meecard.test/api/cards/OP13-118_p3/prices?${query}`,
  );
}

describe("card price-history route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAuthUser.mockResolvedValue(null);
    mocks.findCardByCode.mockResolvedValue({ id: 52_321 });
    mocks.findFirst.mockResolvedValue({ scrapedAt: latestAt });
    mocks.findMany.mockResolvedValue([storedPrice]);
  });

  it.each([
    { label: "anonymous Free", user: null, period: "all", days: 30 },
    {
      label: "active Pro",
      user: {
        id: "user_pro",
        tier: "PRO",
        tierExpiresAt: new Date("2099-01-01T00:00:00.000Z"),
      },
      period: "all",
      days: 365,
    },
    {
      label: "active Pro+",
      user: {
        id: "user_pro_plus",
        tier: "PRO_PLUS",
        tierExpiresAt: new Date("2099-01-01T00:00:00.000Z"),
      },
      period: "all",
      days: null,
    },
    {
      label: "active Pro+ finite request",
      user: {
        id: "user_pro_plus",
        tier: "PRO_PLUS",
        tierExpiresAt: new Date("2099-01-01T00:00:00.000Z"),
      },
      period: "90d",
      days: 90,
    },
    {
      label: "expired Pro",
      user: {
        id: "user_expired_pro",
        tier: "PRO",
        tierExpiresAt: new Date("2020-01-01T00:00:00.000Z"),
      },
      period: "all",
      days: 30,
    },
  ])(
    "enforces the $label history window on the server",
    async ({ user, period, days }) => {
      mocks.getAuthUser.mockResolvedValue(user);

      const response = await GET(
        request(`period=${period}&source=YUYUTEI&grade=raw`),
        context,
      );
      const body = await response.json();
      const findManyArgs = mocks.findMany.mock.calls[0][0];

      expect(response.status).toBe(200);
      expect(body.effectiveDays).toBe(days);
      expect(findManyArgs.orderBy).toEqual([
        { scrapedAt: "asc" },
        { id: "asc" },
      ]);

      if (days === null) {
        expect(findManyArgs.where.scrapedAt).toEqual({ lte: latestAt });
      } else {
        expect(findManyArgs.where.scrapedAt).toEqual({
          gte: new Date(latestAt.getTime() - days * 24 * 60 * 60 * 1_000),
          lte: latestAt,
        });
      }
    },
  );

  it("anchors the range to the newest matching observation and keeps only raw YUYUTEI sells", async () => {
    const response = await GET(
      request("period=30d&source=YUYUTEI&grade=raw"),
      context,
    );
    const body = await response.json();
    const expectedFilter = {
      cardId: 52_321,
      type: "SELL",
      source: "YUYUTEI",
      gradeCondition: null,
      priceJpy: { gt: 0 },
    };

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      prices: [expect.objectContaining({ priceJpy: 268_800 })],
      currency: "JPY",
      high: 268_800,
      low: 268_800,
      avg: 268_800,
      effectiveDays: 30,
    });
    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: expectedFilter,
      orderBy: { scrapedAt: "desc" },
      select: { scrapedAt: true },
    });
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          ...expectedFilter,
          scrapedAt: {
            gte: new Date("2026-03-06T03:00:00.000Z"),
            lte: latestAt,
          },
        },
      }),
    );
  });

  it("rejects an unknown price source before querying the card", async () => {
    const response = await GET(request("source=NOT_A_SOURCE"), context);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid price source",
    });
    expect(mocks.findCardByCode).not.toHaveBeenCalled();
    expect(mocks.findFirst).not.toHaveBeenCalled();
    expect(mocks.findMany).not.toHaveBeenCalled();
  });
});

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuthUser: vi.fn(),
  watchlistFindMany: vi.fn(),
  alertFindMany: vi.fn(),
  cardFindUnique: vi.fn(),
  watchlistFindUnique: vi.fn(),
  watchlistCount: vi.fn(),
  watchlistUpsert: vi.fn(),
  triggerAchievementCheck: vi.fn(),
}));

vi.mock("@/lib/api/auth", () => ({
  requireAuthUser: mocks.requireAuthUser,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    card: { findUnique: mocks.cardFindUnique },
    priceAlert: { findMany: mocks.alertFindMany },
    watchlistItem: {
      findMany: mocks.watchlistFindMany,
      findUnique: mocks.watchlistFindUnique,
      count: mocks.watchlistCount,
      upsert: mocks.watchlistUpsert,
    },
  },
}));

vi.mock("@/lib/honey", () => ({
  triggerAchievementCheck: mocks.triggerAchievementCheck,
}));

import { GET, POST } from "./route";

const rawItem = {
  id: 1,
  userId: "user_1",
  cardId: 10,
  pinnedAt: null,
  addedAt: new Date("2026-07-19T00:00:00.000Z"),
  card: {
    id: 10,
    cardCode: "OP03-122",
    prices: [{ priceUsd: 123.45 }],
    set: { code: "OP03", game: { slug: "opcg" } },
  },
};

describe("watchlist route PSA price contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthUser.mockResolvedValue({
      ok: true,
      user: { id: "user_1", tier: "FREE", tierExpiresAt: null },
    });
    mocks.watchlistFindMany.mockResolvedValue([rawItem]);
    mocks.alertFindMany.mockResolvedValue([]);
    mocks.cardFindUnique.mockResolvedValue({ id: 10 });
    mocks.watchlistFindUnique.mockResolvedValue(null);
    mocks.watchlistCount.mockResolvedValue(0);
    mocks.watchlistUpsert.mockResolvedValue(rawItem);
  });

  it("loads the latest real SNKRDUNK PSA 10 sell price and flattens it", async () => {
    const response = await GET(
      new NextRequest("https://meecard.test/api/watchlist"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.watchlistFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          card: {
            include: expect.objectContaining({
              prices: expect.objectContaining({
                where: {
                  source: "SNKRDUNK",
                  gradeCondition: "PSA 10",
                  type: "SELL",
                },
                orderBy: { scrapedAt: "desc" },
                take: 1,
              }),
            }),
          },
        },
      }),
    );
    expect(body.items[0].card).toMatchObject({
      id: 10,
      psa10PriceUsd: 123.45,
    });
    expect(body.items[0].card).not.toHaveProperty("prices");
  });

  it("returns the same flattened PSA field after adding a card", async () => {
    const response = await POST(
      new NextRequest("https://meecard.test/api/watchlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cardId: 10 }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.item.card).toMatchObject({
      id: 10,
      psa10PriceUsd: 123.45,
    });
    expect(body.item.card).not.toHaveProperty("prices");
    expect(mocks.watchlistUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          card: {
            include: expect.objectContaining({ prices: expect.any(Object) }),
          },
        },
      }),
    );
  });
});

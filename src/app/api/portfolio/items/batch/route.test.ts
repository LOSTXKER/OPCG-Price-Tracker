import { NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuthUser: vi.fn(),
  transaction: vi.fn(),
  portfolioFindUnique: vi.fn(),
  replayFindFirst: vi.fn(),
  cardFindMany: vi.fn(),
  itemFindMany: vi.fn(),
  itemCount: vi.fn(),
  itemCreate: vi.fn(),
  itemUpdate: vi.fn(),
  lotCreate: vi.fn(),
  transactionCreate: vi.fn(),
  triggerAchievementCheck: vi.fn(),
}));

vi.mock("@/lib/api/auth", () => ({
  requireAuthUser: mocks.requireAuthUser,
}));

vi.mock("@/lib/db", () => ({
  prisma: { $transaction: mocks.transaction },
}));

vi.mock("@/lib/honey", () => ({
  triggerAchievementCheck: mocks.triggerAchievementCheck,
}));

vi.mock("@/lib/logger", () => ({
  createLog: () => ({ error: vi.fn() }),
}));

import { POST } from "./route";

const tx = {
  portfolio: { findUnique: mocks.portfolioFindUnique },
  portfolioTransaction: {
    findFirst: mocks.replayFindFirst,
    create: mocks.transactionCreate,
  },
  card: { findMany: mocks.cardFindMany },
  portfolioItem: {
    findMany: mocks.itemFindMany,
    count: mocks.itemCount,
    create: mocks.itemCreate,
    update: mocks.itemUpdate,
  },
  portfolioLot: {
    create: mocks.lotCreate,
  },
};

const requestId = "123e4567-e89b-42d3-a456-426614174000";
const defaultBatchMarker = `__portfolio_batch__:${requestId}:${createHash("sha256")
  .update(
    JSON.stringify({
      portfolioId: 1,
      items: [
        {
          cardId: 10,
          quantity: 1,
          purchasePrice: 100,
          condition: "NM",
          notes: null,
          acquiredAt: "2026-07-23",
        },
      ],
    }),
  )
  .digest("hex")}`;

function request(
  items: Array<{
    cardId: number;
    quantity: number;
    condition: string;
    purchasePrice?: number | null;
    notes?: string;
    acquiredAt?: string | null;
    lotNote?: string | null;
  }> = [{ cardId: 10, quantity: 1, condition: "NM" }],
) {
  const completeItems = items.map((item) => ({
    purchasePrice: 100,
    acquiredAt: "2026-07-23",
    ...item,
  }));
  return new NextRequest("https://meecard.test/api/portfolio/items/batch", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ portfolioId: 1, requestId, items: completeItems }),
  });
}

describe("portfolio batch items route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthUser.mockResolvedValue({
      ok: true,
      user: { id: "user_1", tier: "FREE", tierExpiresAt: null },
    });
    mocks.transaction.mockImplementation(
      async (callback: (client: typeof tx) => unknown) => callback(tx),
    );
    mocks.portfolioFindUnique.mockResolvedValue({ userId: "user_1" });
    mocks.replayFindFirst.mockResolvedValue(null);
    mocks.cardFindMany.mockResolvedValue([{ id: 10 }, { id: 11 }]);
    mocks.itemFindMany.mockResolvedValue([]);
    mocks.itemCount.mockResolvedValue(0);
    mocks.itemCreate.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) => ({
        id: 1,
        ...data,
        addedAt: new Date("2026-07-23T00:00:00.000Z"),
      }),
    );
    mocks.itemUpdate.mockResolvedValue({ id: 1 });
    mocks.lotCreate.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) => ({
        id: mocks.lotCreate.mock.calls.length,
        quantity: data.quantity,
        unitCostJpy: data.unitCostJpy ?? null,
        acquiredAt: data.acquiredAt ?? null,
        note: data.note ?? null,
        source: data.source ?? "MANUAL",
        createdAt: new Date("2026-07-23T00:00:00.000Z"),
        updatedAt: new Date("2026-07-23T00:00:00.000Z"),
      }),
    );
    mocks.transactionCreate.mockResolvedValue({ id: 1 });
  });

  it("rejects every batch item that is missing a real cost or date", async () => {
    const missingCost = await POST(
      request([
        {
          cardId: 10,
          quantity: 1,
          condition: "NM",
          purchasePrice: undefined,
        },
      ]),
    );
    const nullCost = await POST(
      request([
        {
          cardId: 10,
          quantity: 1,
          condition: "NM",
          purchasePrice: null,
        },
      ]),
    );
    const missingDate = await POST(
      request([
        {
          cardId: 10,
          quantity: 1,
          condition: "NM",
          acquiredAt: undefined,
        },
      ]),
    );
    const nullDate = await POST(
      request([
        {
          cardId: 10,
          quantity: 1,
          condition: "NM",
          acquiredAt: null,
        },
      ]),
    );

    expect(missingCost.status).toBe(400);
    expect(nullCost.status).toBe(400);
    expect(missingDate.status).toBe(400);
    expect(nullDate.status).toBe(400);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("returns 401 before opening a transaction", async () => {
    mocks.requireAuthUser.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const response = await POST(request());

    expect(response.status).toBe(401);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("distinguishes a foreign portfolio from a missing one", async () => {
    mocks.portfolioFindUnique.mockResolvedValueOnce({ userId: "other_user" });
    const forbidden = await POST(request());

    mocks.portfolioFindUnique.mockResolvedValueOnce(null);
    const missing = await POST(request());

    expect(forbidden.status).toBe(403);
    expect(missing.status).toBe(404);
  });

  it("validates every card before writing any holding", async () => {
    mocks.cardFindMany.mockResolvedValue([{ id: 10 }]);

    const response = await POST(
      request([
        { cardId: 10, quantity: 1, condition: "NM" },
        { cardId: 11, quantity: 1, condition: "NM" },
      ]),
    );

    expect(response.status).toBe(404);
    expect(mocks.itemCreate).not.toHaveBeenCalled();
    expect(mocks.itemUpdate).not.toHaveBeenCalled();
    expect(mocks.lotCreate).not.toHaveBeenCalled();
  });

  it("checks the whole batch against quota before writing", async () => {
    mocks.itemCount.mockResolvedValue(29);

    const response = await POST(
      request([
        { cardId: 10, quantity: 1, condition: "NM" },
        { cardId: 11, quantity: 1, condition: "NM" },
      ]),
    );

    expect(response.status).toBe(403);
    expect(mocks.itemCreate).not.toHaveBeenCalled();
    expect(mocks.lotCreate).not.toHaveBeenCalled();
    expect(mocks.transactionCreate).not.toHaveBeenCalled();
  });

  it("updates an existing holding without consuming another quota row", async () => {
    mocks.itemCount.mockResolvedValue(30);
    mocks.itemFindMany.mockResolvedValue([
      {
        id: 7,
        portfolioId: 1,
        cardId: 10,
        condition: "NM",
        quantity: 2,
        purchasePrice: 100,
        addedAt: new Date("2026-07-01T00:00:00.000Z"),
        lots: [
          {
            id: 70,
            quantity: 2,
            unitCostJpy: 100,
            acquiredAt: null,
            note: null,
            source: "LEGACY_OPENING_BALANCE",
            createdAt: new Date("2026-07-01T00:00:00.000Z"),
            updatedAt: new Date("2026-07-01T00:00:00.000Z"),
          },
        ],
      },
    ]);

    const response = await POST(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ ok: true, added: 0, updated: 1, replayed: false });
    expect(mocks.itemCount).not.toHaveBeenCalled();
    expect(mocks.itemUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          quantity: 3,
          purchasePrice: 100,
        }),
      }),
    );
    expect(mocks.lotCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          portfolioItemId: 7,
          quantity: 1,
          unitCostJpy: 100,
          acquiredAt: new Date("2026-07-23T00:00:00.000Z"),
          source: "MANUAL",
        }),
      }),
    );
  });

  it("keeps exact lot costs when adding copies at a different price", async () => {
    mocks.itemFindMany.mockResolvedValue([
      {
        id: 7,
        portfolioId: 1,
        cardId: 10,
        condition: "NM",
        quantity: 1,
        purchasePrice: 100,
        addedAt: new Date("2026-07-01T00:00:00.000Z"),
        lots: [
          {
            id: 70,
            quantity: 1,
            unitCostJpy: 100,
            acquiredAt: null,
            note: null,
            source: "LEGACY_OPENING_BALANCE",
            createdAt: new Date("2026-07-01T00:00:00.000Z"),
            updatedAt: new Date("2026-07-01T00:00:00.000Z"),
          },
        ],
      },
    ]);

    const response = await POST(
      request([
        {
          cardId: 10,
          quantity: 2,
          purchasePrice: 200,
          condition: "NM",
        },
      ]),
    );

    expect(response.status).toBe(200);
    expect(mocks.lotCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          quantity: 2,
          unitCostJpy: 200,
        }),
      }),
    );
    expect(mocks.itemUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          quantity: 3,
          purchasePrice: 167,
        },
      }),
    );
  });

  it("persists a separate date and note on every new acquisition lot", async () => {
    const response = await POST(
      request([
        {
          cardId: 10,
          quantity: 2,
          purchasePrice: 200,
          condition: "NM",
          acquiredAt: "2026-07-20",
          lotNote: "ซื้อจากร้าน A",
        },
        {
          cardId: 11,
          quantity: 1,
          purchasePrice: 0,
          condition: "NM",
          acquiredAt: "2026-07-24",
          lotNote: null,
        },
      ]),
    );

    expect(response.status).toBe(200);
    expect(mocks.lotCreate).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({
          quantity: 2,
          unitCostJpy: 200,
          acquiredAt: new Date("2026-07-20T00:00:00.000Z"),
          note: "ซื้อจากร้าน A",
        }),
      }),
    );
    expect(mocks.lotCreate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({
          quantity: 1,
          unitCostJpy: 0,
          acquiredAt: new Date("2026-07-24T00:00:00.000Z"),
          note: null,
        }),
      }),
    );
  });

  it("rejects a merged holding quantity above the item maximum before writing", async () => {
    mocks.itemFindMany.mockResolvedValue([
      {
        id: 7,
        portfolioId: 1,
        cardId: 10,
        condition: "NM",
        quantity: 999,
        purchasePrice: null,
        addedAt: new Date("2026-07-01T00:00:00.000Z"),
        lots: [
          {
            id: 70,
            quantity: 999,
            unitCostJpy: null,
            acquiredAt: null,
            note: null,
            source: "LEGACY_OPENING_BALANCE",
            createdAt: new Date("2026-07-01T00:00:00.000Z"),
            updatedAt: new Date("2026-07-01T00:00:00.000Z"),
          },
        ],
      },
    ]);

    const response = await POST(request());

    expect(response.status).toBe(400);
    expect(mocks.itemCreate).not.toHaveBeenCalled();
    expect(mocks.itemUpdate).not.toHaveBeenCalled();
    expect(mocks.lotCreate).not.toHaveBeenCalled();
    expect(mocks.transactionCreate).not.toHaveBeenCalled();
  });

  it("treats a committed requestId retry as a successful replay", async () => {
    const firstResponse = await POST(request());
    const marker = mocks.transactionCreate.mock.calls[0]?.[0]?.data?.note;
    expect(firstResponse.status).toBe(200);
    expect(marker).toMatch(/^__portfolio_batch__:/);
    mocks.replayFindFirst.mockResolvedValue({ id: 99, note: marker });

    const response = await POST(request());
    const body = await response.json();

    expect(body).toMatchObject({ ok: true, added: 0, updated: 0, replayed: true });
    expect(mocks.cardFindMany).toHaveBeenCalledTimes(1);
    expect(mocks.itemCreate).toHaveBeenCalledTimes(1);
    expect(mocks.lotCreate).toHaveBeenCalledTimes(1);
  });

  it("rejects reuse of a requestId for a different payload", async () => {
    const firstResponse = await POST(request());
    const marker = mocks.transactionCreate.mock.calls[0]?.[0]?.data?.note;
    expect(firstResponse.status).toBe(200);
    mocks.replayFindFirst.mockResolvedValue({ id: 99, note: marker });

    const response = await POST(
      request([{ cardId: 10, quantity: 2, condition: "NM" }]),
    );

    expect(response.status).toBe(409);
    expect(mocks.itemCreate).toHaveBeenCalledTimes(1);
    expect(mocks.lotCreate).toHaveBeenCalledTimes(1);
    expect(mocks.itemUpdate).not.toHaveBeenCalled();
  });

  it("includes the purchase-lot note in the idempotency payload hash", async () => {
    const firstResponse = await POST(
      request([
        {
          cardId: 10,
          quantity: 1,
          condition: "NM",
          lotNote: "ร้าน A",
        },
      ]),
    );
    const marker = mocks.transactionCreate.mock.calls[0]?.[0]?.data?.note;
    expect(firstResponse.status).toBe(200);
    mocks.replayFindFirst.mockResolvedValue({ id: 99, note: marker });

    const response = await POST(
      request([
        {
          cardId: 10,
          quantity: 1,
          condition: "NM",
          lotNote: "ร้าน B",
        },
      ]),
    );

    expect(response.status).toBe(409);
    expect(mocks.itemCreate).toHaveBeenCalledTimes(1);
    expect(mocks.lotCreate).toHaveBeenCalledTimes(1);
  });

  it("retries a serializable conflict with the same validated batch", async () => {
    mocks.transaction.mockRejectedValueOnce({ code: "P2034" });

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(mocks.transaction).toHaveBeenCalledTimes(2);
    expect(mocks.itemCreate).toHaveBeenCalledTimes(1);
  });

  it("retries a concurrent unique conflict so the request can replay", async () => {
    mocks.transaction.mockRejectedValueOnce({ code: "P2002" });
    mocks.replayFindFirst.mockResolvedValueOnce({
      id: 99,
      note: defaultBatchMarker,
    });

    const response = await POST(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ ok: true, replayed: true });
    expect(mocks.transaction).toHaveBeenCalledTimes(2);
    expect(mocks.itemCreate).not.toHaveBeenCalled();
  });

  it("returns 500 when a write fails inside the transaction", async () => {
    mocks.itemCreate.mockRejectedValue(new Error("write failed"));

    const response = await POST(request());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal server error" });
  });
});

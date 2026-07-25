import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuthUser: vi.fn(),
  transaction: vi.fn(),
  itemFindUnique: vi.fn(),
  itemFindUniqueOrThrow: vi.fn(),
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

const now = new Date("2026-07-23T00:00:00.000Z");
const existingLot = {
  id: 70,
  quantity: 1,
  unitCostJpy: 100,
  acquiredAt: null,
  note: null,
  source: "LEGACY_OPENING_BALANCE",
  createdAt: now,
  updatedAt: now,
};
const tx = {
  portfolioItem: {
    findUnique: mocks.itemFindUnique,
    findUniqueOrThrow: mocks.itemFindUniqueOrThrow,
    update: mocks.itemUpdate,
  },
  portfolioLot: { create: mocks.lotCreate },
  portfolioTransaction: { create: mocks.transactionCreate },
};

function request(body: Record<string, unknown> = {}) {
  return new NextRequest(
    "https://meecard.test/api/portfolio/items/7/lots",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        quantity: 2,
        unitCostJpy: 200,
        acquiredAt: "2026-07-20",
        note: "ซื้อหน้าร้าน",
        ...body,
      }),
    },
  );
}

describe("portfolio item lots route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthUser.mockResolvedValue({
      ok: true,
      user: { id: "user_1" },
    });
    mocks.transaction.mockImplementation(
      async (callback: (client: typeof tx) => unknown) => callback(tx),
    );
    mocks.itemFindUnique.mockResolvedValue({
      id: 7,
      portfolioId: 1,
      cardId: 10,
      quantity: 1,
      purchasePrice: 100,
      addedAt: now,
      portfolio: { userId: "user_1" },
      lots: [existingLot],
    });
    mocks.lotCreate.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) => ({
        id: 71,
        quantity: data.quantity,
        unitCostJpy: data.unitCostJpy,
        acquiredAt: data.acquiredAt,
        note: data.note,
        source: data.source,
        createdAt: now,
        updatedAt: now,
      }),
    );
    mocks.itemUpdate.mockResolvedValue({ id: 7 });
    mocks.transactionCreate.mockResolvedValue({ id: 90 });
    mocks.itemFindUniqueOrThrow.mockResolvedValue({
      id: 7,
      portfolioId: 1,
      cardId: 10,
      quantity: 3,
      purchasePrice: 167,
      card: { id: 10 },
      lots: [
        existingLot,
        {
          ...existingLot,
          id: 71,
          quantity: 2,
          unitCostJpy: 200,
          source: "MANUAL",
        },
      ],
    });
  });

  it("rejects a new lot without a real cost or date", async () => {
    const missingCost = await POST(request({ unitCostJpy: undefined }), {
      params: Promise.resolve({ id: "7" }),
    });
    const nullCost = await POST(request({ unitCostJpy: null }), {
      params: Promise.resolve({ id: "7" }),
    });
    const missingDate = await POST(request({ acquiredAt: undefined }), {
      params: Promise.resolve({ id: "7" }),
    });
    const nullDate = await POST(request({ acquiredAt: null }), {
      params: Promise.resolve({ id: "7" }),
    });

    expect(missingCost.status).toBe(400);
    expect(nullCost.status).toBe(400);
    expect(missingDate.status).toBe(400);
    expect(nullDate.status).toBe(400);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("accepts zero as an explicit cost for a dated lot", async () => {
    const response = await POST(request({ unitCostJpy: 0 }), {
      params: Promise.resolve({ id: "7" }),
    });

    expect(response.status).toBe(201);
    expect(mocks.lotCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          unitCostJpy: 0,
          acquiredAt: new Date("2026-07-20T00:00:00.000Z"),
        }),
      }),
    );
  });

  it("adds a dated lot and writes an exact BUY audit row", async () => {
    const response = await POST(request(), {
      params: Promise.resolve({ id: "7" }),
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.item).toMatchObject({
      quantity: 3,
      recordedCostJpy: 500,
      costedCopyCount: 3,
      lotCount: 2,
    });
    expect(mocks.lotCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          portfolioItemId: 7,
          quantity: 2,
          unitCostJpy: 200,
          acquiredAt: new Date("2026-07-20T00:00:00.000Z"),
          note: "ซื้อหน้าร้าน",
          source: "MANUAL",
        }),
      }),
    );
    expect(mocks.transactionCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        quantity: 2,
        pricePerUnit: 200,
        note: "ซื้อหน้าร้าน",
        type: "BUY",
      }),
    });
  });

  it("rejects a foreign holding before creating a lot", async () => {
    mocks.itemFindUnique.mockResolvedValue({
      id: 7,
      portfolio: { userId: "other_user" },
      lots: [existingLot],
    });

    const response = await POST(request(), {
      params: Promise.resolve({ id: "7" }),
    });

    expect(response.status).toBe(403);
    expect(mocks.lotCreate).not.toHaveBeenCalled();
    expect(mocks.transactionCreate).not.toHaveBeenCalled();
  });
});

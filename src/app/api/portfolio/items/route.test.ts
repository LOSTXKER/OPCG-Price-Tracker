import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuthUser: vi.fn(),
  transaction: vi.fn(),
  portfolioFindUnique: vi.fn(),
  cardFindUnique: vi.fn(),
  itemFindUnique: vi.fn(),
  itemFindUniqueOrThrow: vi.fn(),
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

const now = new Date("2026-07-23T00:00:00.000Z");
const lot = {
  id: 70,
  quantity: 1,
  unitCostJpy: 100,
  acquiredAt: null,
  note: null,
  source: "MANUAL",
  createdAt: now,
  updatedAt: now,
};
const tx = {
  portfolio: { findUnique: mocks.portfolioFindUnique },
  card: { findUnique: mocks.cardFindUnique },
  portfolioItem: {
    findUnique: mocks.itemFindUnique,
    findUniqueOrThrow: mocks.itemFindUniqueOrThrow,
    count: mocks.itemCount,
    create: mocks.itemCreate,
    update: mocks.itemUpdate,
  },
  portfolioLot: { create: mocks.lotCreate },
  portfolioTransaction: { create: mocks.transactionCreate },
};

function request(body: Record<string, unknown> = {}) {
  return new NextRequest("https://meecard.test/api/portfolio/items", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      portfolioId: 1,
      cardId: 10,
      quantity: 1,
      purchasePrice: 100,
      acquiredAt: "2026-07-23",
      ...body,
    }),
  });
}

describe("portfolio item route", () => {
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
    mocks.cardFindUnique.mockResolvedValue({ id: 10 });
    mocks.itemFindUnique.mockResolvedValue(null);
    mocks.itemCount.mockResolvedValue(0);
    mocks.itemCreate.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) => ({
        id: 7,
        ...data,
        addedAt: now,
      }),
    );
    mocks.itemUpdate.mockResolvedValue({ id: 7 });
    mocks.lotCreate.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) => ({
        ...lot,
        quantity: data.quantity,
        unitCostJpy: data.unitCostJpy ?? null,
        acquiredAt: data.acquiredAt ?? null,
        note: data.note ?? null,
      }),
    );
    mocks.transactionCreate.mockResolvedValue({ id: 1 });
    mocks.itemFindUniqueOrThrow.mockResolvedValue({
      id: 7,
      portfolioId: 1,
      cardId: 10,
      quantity: 1,
      purchasePrice: 100,
      condition: "NM",
      notes: null,
      isPrivate: false,
      addedAt: now,
      card: { id: 10 },
      lots: [lot],
    });
  });

  it("rejects a new acquisition without a real cost or date", async () => {
    const missingCost = await POST(request({ purchasePrice: undefined }));
    const nullCost = await POST(request({ purchasePrice: null }));
    const missingDate = await POST(request({ acquiredAt: undefined }));
    const nullDate = await POST(request({ acquiredAt: null }));

    expect(missingCost.status).toBe(400);
    expect(nullCost.status).toBe(400);
    expect(missingDate.status).toBe(400);
    expect(nullDate.status).toBe(400);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("accepts zero as an explicit per-card cost", async () => {
    const response = await POST(request({ purchasePrice: 0 }));

    expect(response.status).toBe(201);
    expect(mocks.lotCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          unitCostJpy: 0,
          acquiredAt: new Date("2026-07-23T00:00:00.000Z"),
        }),
      }),
    );
  });

  it("rejects a new parent holding when the user quota is full", async () => {
    mocks.itemCount.mockResolvedValue(30);

    const response = await POST(request());

    expect(response.status).toBe(403);
    expect(mocks.itemCreate).not.toHaveBeenCalled();
    expect(mocks.lotCreate).not.toHaveBeenCalled();
  });

  it("adds a lot to an existing holding even when the parent quota is full", async () => {
    mocks.itemCount.mockResolvedValue(30);
    mocks.itemFindUnique.mockResolvedValue({
      id: 7,
      portfolioId: 1,
      cardId: 10,
      quantity: 1,
      purchasePrice: 100,
      condition: "NM",
      notes: null,
      isPrivate: false,
      addedAt: now,
      lots: [lot],
    });

    const response = await POST(
      request({ quantity: 2, purchasePrice: 200 }),
    );

    expect(response.status).toBe(200);
    expect(mocks.itemCount).not.toHaveBeenCalled();
    expect(mocks.itemCreate).not.toHaveBeenCalled();
    expect(mocks.lotCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          portfolioItemId: 7,
          quantity: 2,
          unitCostJpy: 200,
          source: "MANUAL",
        }),
      }),
    );
    expect(mocks.itemUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { quantity: 3, purchasePrice: 167 },
      }),
    );
  });

  it("keeps holding notes separate while persisting purchase-lot metadata", async () => {
    mocks.itemFindUnique.mockResolvedValue({
      id: 7,
      portfolioId: 1,
      cardId: 10,
      quantity: 1,
      purchasePrice: 100,
      condition: "NM",
      notes: null,
      isPrivate: false,
      addedAt: now,
      lots: [lot],
    });

    const response = await POST(
      request({
        notes: "ของสะสม",
        acquiredAt: "2026-07-20",
        lotNote: "ซื้อจากร้าน A",
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.lotCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          acquiredAt: new Date("2026-07-20T00:00:00.000Z"),
          note: "ซื้อจากร้าน A",
        }),
      }),
    );
    expect(mocks.itemUpdate).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { notes: "ของสะสม" },
    });
  });

  it("does not write into a portfolio owned by another user", async () => {
    mocks.portfolioFindUnique.mockResolvedValue({ userId: "other_user" });

    const response = await POST(request());

    expect(response.status).toBe(403);
    expect(mocks.itemFindUnique).not.toHaveBeenCalled();
    expect(mocks.lotCreate).not.toHaveBeenCalled();
  });
});

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuthUser: vi.fn(),
  transaction: vi.fn(),
  lotFindUnique: vi.fn(),
  lotUpdate: vi.fn(),
  lotDelete: vi.fn(),
  itemUpdate: vi.fn(),
  itemDelete: vi.fn(),
  itemFindUniqueOrThrow: vi.fn(),
  transactionCreate: vi.fn(),
}));

vi.mock("@/lib/api/auth", () => ({
  requireAuthUser: mocks.requireAuthUser,
}));

vi.mock("@/lib/db", () => ({
  prisma: { $transaction: mocks.transaction },
}));

vi.mock("@/lib/logger", () => ({
  createLog: () => ({ error: vi.fn() }),
}));

import { DELETE, PATCH } from "./route";

const now = new Date("2026-07-23T00:00:00.000Z");
const firstLot = {
  id: 70,
  quantity: 1,
  unitCostJpy: 100 as number | null,
  acquiredAt: null,
  note: "ล็อตแรก",
  source: "LEGACY_OPENING_BALANCE",
  createdAt: now,
  updatedAt: now,
};
const secondLot = {
  ...firstLot,
  id: 71,
  quantity: 2,
  unitCostJpy: 200,
  note: "ล็อตสอง",
  source: "MANUAL",
};
const tx = {
  portfolioLot: {
    findUnique: mocks.lotFindUnique,
    update: mocks.lotUpdate,
    delete: mocks.lotDelete,
  },
  portfolioItem: {
    update: mocks.itemUpdate,
    delete: mocks.itemDelete,
    findUniqueOrThrow: mocks.itemFindUniqueOrThrow,
  },
  portfolioTransaction: { create: mocks.transactionCreate },
};

function routeLot(lots = [firstLot, secondLot]) {
  const target =
    lots.find((lot) => lot.id === 71) ?? lots[lots.length - 1] ?? secondLot;
  return {
    ...target,
    portfolioItemId: 7,
    portfolioItem: {
      id: 7,
      portfolioId: 1,
      cardId: 10,
      quantity: 3,
      purchasePrice: 167,
      addedAt: now,
      portfolio: { userId: "user_1" },
      lots,
    },
  };
}

function patchRequest(body: Record<string, unknown>) {
  return new NextRequest("https://meecard.test/api/portfolio/lots/71", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function deleteRequest() {
  return new NextRequest("https://meecard.test/api/portfolio/lots/71", {
    method: "DELETE",
  });
}

describe("portfolio lot detail route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthUser.mockResolvedValue({
      ok: true,
      user: { id: "user_1" },
    });
    mocks.transaction.mockImplementation(
      async (callback: (client: typeof tx) => unknown) => callback(tx),
    );
    mocks.lotFindUnique.mockResolvedValue(routeLot());
    mocks.lotUpdate.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) => ({
        ...secondLot,
        ...data,
      }),
    );
    mocks.lotDelete.mockResolvedValue(secondLot);
    mocks.itemUpdate.mockResolvedValue({ id: 7 });
    mocks.itemDelete.mockResolvedValue({ id: 7 });
    mocks.transactionCreate.mockResolvedValue({ id: 90 });
    mocks.itemFindUniqueOrThrow.mockResolvedValue({
      id: 7,
      quantity: 3,
      purchasePrice: 200,
      card: { id: 10 },
      lots: [firstLot, { ...secondLot, unitCostJpy: 250 }],
    });
  });

  it("records REMOVE then BUY when cost changes, preserving unknown versus zero", async () => {
    const unknownCostLot = { ...secondLot, unitCostJpy: null };
    mocks.lotFindUnique.mockResolvedValue(
      routeLot([firstLot, unknownCostLot]),
    );
    mocks.itemFindUniqueOrThrow.mockResolvedValue({
      id: 7,
      quantity: 3,
      purchasePrice: 33,
      card: { id: 10 },
      lots: [firstLot, { ...unknownCostLot, unitCostJpy: 0 }],
    });

    const response = await PATCH(patchRequest({ unitCostJpy: 0 }), {
      params: Promise.resolve({ lotId: "71" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.itemUpdate).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { quantity: 3, purchasePrice: 33 },
    });
    expect(mocks.transactionCreate).toHaveBeenCalledTimes(2);
    expect(mocks.transactionCreate).toHaveBeenNthCalledWith(1, {
      data: {
        portfolioId: 1,
        cardId: 10,
        type: "REMOVE",
        quantity: 2,
        pricePerUnit: null,
        note: "ล็อตสอง",
      },
    });
    expect(mocks.transactionCreate).toHaveBeenNthCalledWith(2, {
      data: {
        portfolioId: 1,
        cardId: 10,
        type: "BUY",
        quantity: 2,
        pricePerUnit: 0,
        note: "ล็อตสอง",
      },
    });
    expect(body.item).toMatchObject({
      recordedCostJpy: 100,
      costedCopyCount: 3,
      purchasePrice: 33,
    });
  });

  it("keeps an explicit legacy null cost as unknown instead of coercing it to zero", async () => {
    mocks.itemFindUniqueOrThrow.mockResolvedValue({
      id: 7,
      quantity: 3,
      purchasePrice: null,
      card: { id: 10 },
      lots: [firstLot, { ...secondLot, unitCostJpy: null }],
    });

    const response = await PATCH(patchRequest({ unitCostJpy: null }), {
      params: Promise.resolve({ lotId: "71" }),
    });

    expect(response.status).toBe(200);
    expect(mocks.lotUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ unitCostJpy: null }),
      }),
    );
    expect(mocks.transactionCreate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({ pricePerUnit: null }),
      }),
    );
  });

  it("records the prior and updated quantities when quantity changes", async () => {
    mocks.itemFindUniqueOrThrow.mockResolvedValue({
      id: 7,
      quantity: 4,
      purchasePrice: 175,
      card: { id: 10 },
      lots: [firstLot, { ...secondLot, quantity: 3 }],
    });

    const response = await PATCH(patchRequest({ quantity: 3 }), {
      params: Promise.resolve({ lotId: "71" }),
    });

    expect(response.status).toBe(200);
    expect(mocks.transactionCreate).toHaveBeenCalledTimes(2);
    expect(mocks.transactionCreate).toHaveBeenNthCalledWith(1, {
      data: expect.objectContaining({
        type: "REMOVE",
        quantity: 2,
        pricePerUnit: 200,
      }),
    });
    expect(mocks.transactionCreate).toHaveBeenNthCalledWith(2, {
      data: expect.objectContaining({
        type: "BUY",
        quantity: 3,
        pricePerUnit: 200,
      }),
    });
  });

  it("does not create money events for note and date-only edits", async () => {
    const response = await PATCH(
      patchRequest({
        note: "ย้ายกล่องเก็บ",
        acquiredAt: "2026-07-22",
      }),
      { params: Promise.resolve({ lotId: "71" }) },
    );

    expect(response.status).toBe(200);
    expect(mocks.lotUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          note: "ย้ายกล่องเก็บ",
          acquiredAt: new Date("2026-07-22T00:00:00.000Z"),
        }),
      }),
    );
    expect(mocks.transactionCreate).not.toHaveBeenCalled();
  });

  it("does not create money events when quantity and cost are submitted unchanged", async () => {
    const response = await PATCH(
      patchRequest({
        quantity: 2,
        unitCostJpy: 200,
        note: "แก้หมายเหตุเท่านั้น",
      }),
      { params: Promise.resolve({ lotId: "71" }) },
    );

    expect(response.status).toBe(200);
    expect(mocks.transactionCreate).not.toHaveBeenCalled();
  });

  it("retries a write conflict without leaving duplicate compensation events", async () => {
    mocks.transaction.mockRejectedValueOnce({ code: "P2034" });

    const response = await PATCH(patchRequest({ unitCostJpy: 250 }), {
      params: Promise.resolve({ lotId: "71" }),
    });

    expect(response.status).toBe(200);
    expect(mocks.transaction).toHaveBeenCalledTimes(2);
    expect(mocks.transactionCreate).toHaveBeenCalledTimes(2);
  });

  it("deletes one lot, keeps its parent, and logs that lot's exact cost", async () => {
    mocks.itemFindUniqueOrThrow.mockResolvedValue({
      id: 7,
      quantity: 1,
      purchasePrice: 100,
      card: { id: 10 },
      lots: [firstLot],
    });

    const response = await DELETE(deleteRequest(), {
      params: Promise.resolve({ lotId: "71" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ ok: true, deletedItem: false });
    expect(mocks.itemDelete).not.toHaveBeenCalled();
    expect(mocks.itemUpdate).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { quantity: 1, purchasePrice: 100 },
    });
    expect(mocks.transactionCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        quantity: 2,
        pricePerUnit: 200,
        note: "ล็อตสอง",
        type: "REMOVE",
      }),
    });
  });

  it("deletes the parent only when the final lot is deleted", async () => {
    mocks.lotFindUnique.mockResolvedValue(routeLot([secondLot]));

    const response = await DELETE(deleteRequest(), {
      params: Promise.resolve({ lotId: "71" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, deletedItem: true, item: null });
    expect(mocks.itemDelete).toHaveBeenCalledWith({ where: { id: 7 } });
    expect(mocks.itemFindUniqueOrThrow).not.toHaveBeenCalled();
  });

  it("enforces owner access before mutating a lot", async () => {
    mocks.lotFindUnique.mockResolvedValue({
      ...routeLot(),
      portfolioItem: {
        ...routeLot().portfolioItem,
        portfolio: { userId: "other_user" },
      },
    });

    const response = await PATCH(patchRequest({ quantity: 1 }), {
      params: Promise.resolve({ lotId: "71" }),
    });

    expect(response.status).toBe(403);
    expect(mocks.lotUpdate).not.toHaveBeenCalled();
    expect(mocks.itemUpdate).not.toHaveBeenCalled();
    expect(mocks.transactionCreate).not.toHaveBeenCalled();
  });
});

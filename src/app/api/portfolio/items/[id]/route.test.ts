import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuthUser: vi.fn(),
  transaction: vi.fn(),
  itemFindUnique: vi.fn(),
  itemFindUniqueOrThrow: vi.fn(),
  itemUpdate: vi.fn(),
  itemDelete: vi.fn(),
  lotCreate: vi.fn(),
  lotUpdate: vi.fn(),
  transactionCreate: vi.fn(),
}));

vi.mock("@/lib/api/auth", () => ({
  requireAuthUser: mocks.requireAuthUser,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: mocks.transaction,
    portfolioItem: {
      findUnique: mocks.itemFindUnique,
      findUniqueOrThrow: mocks.itemFindUniqueOrThrow,
      update: mocks.itemUpdate,
      delete: mocks.itemDelete,
    },
    portfolioLot: {
      create: mocks.lotCreate,
      update: mocks.lotUpdate,
    },
    portfolioTransaction: {
      create: mocks.transactionCreate,
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  createLog: () => ({ error: vi.fn() }),
}));

import { DELETE, PATCH } from "./route";

const now = new Date("2026-07-23T00:00:00.000Z");
const firstLot = {
  id: 70,
  quantity: 1,
  unitCostJpy: 100,
  acquiredAt: null,
  note: "ล็อตแรก",
  source: "MANUAL",
  createdAt: now,
  updatedAt: now,
};
const secondLot = {
  ...firstLot,
  id: 71,
  quantity: 2,
  unitCostJpy: 200,
  note: "ล็อตสอง",
};
const tx = {
  portfolioItem: {
    findUnique: mocks.itemFindUnique,
    findUniqueOrThrow: mocks.itemFindUniqueOrThrow,
    update: mocks.itemUpdate,
    delete: mocks.itemDelete,
  },
  portfolioLot: {
    create: mocks.lotCreate,
    update: mocks.lotUpdate,
  },
  portfolioTransaction: {
    create: mocks.transactionCreate,
  },
};

function item(lots = [firstLot]) {
  return {
    id: 7,
    portfolioId: 1,
    cardId: 10,
    quantity: lots.reduce((sum, lot) => sum + lot.quantity, 0),
    purchasePrice: 100,
    condition: "NM",
    notes: null,
    isPrivate: false,
    addedAt: now,
    portfolio: { id: 1, userId: "user_1" },
    lots,
  };
}

function patchRequest(body: Record<string, unknown>) {
  return new NextRequest("https://meecard.test/api/portfolio/items/7", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function deleteRequest() {
  return new NextRequest("https://meecard.test/api/portfolio/items/7", {
    method: "DELETE",
  });
}

describe("portfolio item detail route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthUser.mockResolvedValue({
      ok: true,
      user: { id: "user_1" },
    });
    mocks.transaction.mockImplementation(
      async (work: unknown) =>
        typeof work === "function"
          ? (work as (client: typeof tx) => unknown)(tx)
          : Promise.all(work as Promise<unknown>[]),
    );
    mocks.itemFindUnique.mockResolvedValue(item());
    mocks.itemUpdate.mockResolvedValue({ id: 7 });
    mocks.itemDelete.mockResolvedValue({ id: 7 });
    mocks.lotUpdate.mockImplementation(
      ({
        where,
        data,
      }: {
        where: { id: number };
        data: Record<string, unknown>;
      }) => ({
        ...firstLot,
        id: where.id,
        ...data,
      }),
    );
    mocks.itemFindUniqueOrThrow.mockResolvedValue({
      ...item(),
      quantity: 2,
      purchasePrice: 200,
      card: { id: 10 },
      lots: [{ ...firstLot, quantity: 2, unitCostJpy: 200 }],
    });
    mocks.transactionCreate.mockResolvedValue({ id: 90 });
  });

  it("keeps legacy quantity/cost PATCH working for a single lot", async () => {
    const response = await PATCH(
      patchRequest({ quantity: 2, purchasePrice: 200 }),
      { params: Promise.resolve({ id: "7" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.lotUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 70 },
        data: expect.objectContaining({
          quantity: 2,
          unitCostJpy: 200,
        }),
      }),
    );
    expect(mocks.transactionCreate).toHaveBeenNthCalledWith(1, {
      data: expect.objectContaining({
        type: "REMOVE",
        quantity: 1,
        pricePerUnit: 100,
        note: "ล็อตแรก",
      }),
    });
    expect(mocks.transactionCreate).toHaveBeenNthCalledWith(2, {
      data: expect.objectContaining({
        type: "BUY",
        quantity: 2,
        pricePerUnit: 200,
        note: "ล็อตแรก",
      }),
    });
    expect(body.item).toMatchObject({
      quantity: 2,
      recordedCostJpy: 400,
      costedCopyCount: 2,
    });
  });

  it("materializes and edits every legacy opening-row field in one PATCH", async () => {
    const legacyItem = {
      ...item([]),
      quantity: 2,
      purchasePrice: null,
      lots: [],
    };
    const openingLot = {
      ...firstLot,
      id: 72,
      quantity: 2,
      unitCostJpy: null,
      acquiredAt: null,
      note: null,
      source: "LEGACY_OPENING_BALANCE",
    };
    const finalLot = {
      ...openingLot,
      quantity: 3,
      unitCostJpy: 0,
      acquiredAt: new Date("2026-07-12T00:00:00.000Z"),
      note: "ยอดตั้งต้น",
    };
    mocks.itemFindUnique.mockResolvedValue(legacyItem);
    mocks.lotCreate.mockResolvedValue(openingLot);
    mocks.itemFindUniqueOrThrow.mockResolvedValue({
      ...legacyItem,
      quantity: 3,
      purchasePrice: 0,
      card: { id: 10 },
      lots: [finalLot],
    });

    const response = await PATCH(
      patchRequest({
        quantity: 3,
        purchasePrice: 0,
        acquiredAt: "2026-07-12",
        lotNote: "ยอดตั้งต้น",
      }),
      { params: Promise.resolve({ id: "7" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.lotCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        portfolioItemId: 7,
        quantity: 2,
        unitCostJpy: null,
        source: "LEGACY_OPENING_BALANCE",
      }),
      select: expect.any(Object),
    });
    expect(mocks.lotUpdate).toHaveBeenCalledWith({
      where: { id: 72 },
      data: {
        quantity: 3,
        unitCostJpy: 0,
        acquiredAt: new Date("2026-07-12T00:00:00.000Z"),
        note: "ยอดตั้งต้น",
      },
      select: expect.any(Object),
    });
    expect(body.item).toMatchObject({
      quantity: 3,
      purchasePrice: 0,
      recordedCostJpy: 0,
      costedCopyCount: 3,
      lotCount: 1,
    });
    expect(mocks.transactionCreate).toHaveBeenNthCalledWith(1, {
      data: expect.objectContaining({
        type: "REMOVE",
        quantity: 2,
        pricePerUnit: null,
        note: null,
      }),
    });
    expect(mocks.transactionCreate).toHaveBeenNthCalledWith(2, {
      data: expect.objectContaining({
        type: "BUY",
        quantity: 3,
        pricePerUnit: 0,
        note: "ยอดตั้งต้น",
      }),
    });
  });

  it("does not create money events for a date/note-only compatibility PATCH", async () => {
    const response = await PATCH(
      patchRequest({
        acquiredAt: "2026-07-12",
        lotNote: "แก้เฉพาะรายละเอียด",
      }),
      { params: Promise.resolve({ id: "7" }) },
    );

    expect(response.status).toBe(200);
    expect(mocks.lotUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 70 },
        data: {
          acquiredAt: new Date("2026-07-12T00:00:00.000Z"),
          note: "แก้เฉพาะรายละเอียด",
        },
      }),
    );
    expect(mocks.transactionCreate).not.toHaveBeenCalled();
  });

  it("rejects a legacy quantity/cost PATCH once a holding has multiple lots", async () => {
    mocks.itemFindUnique.mockResolvedValue(item([firstLot, secondLot]));

    const response = await PATCH(
      patchRequest({ purchasePrice: 300 }),
      { params: Promise.resolve({ id: "7" }) },
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "Quantity and cost must be edited per acquisition lot",
    });
    expect(mocks.lotUpdate).not.toHaveBeenCalled();
    expect(mocks.itemUpdate).not.toHaveBeenCalled();
  });

  it("logs each lot exactly when deleting the whole parent holding", async () => {
    mocks.itemFindUnique.mockResolvedValue(item([firstLot, secondLot]));

    const response = await DELETE(deleteRequest(), {
      params: Promise.resolve({ id: "7" }),
    });

    expect(response.status).toBe(200);
    expect(mocks.transactionCreate).toHaveBeenCalledTimes(2);
    expect(mocks.transactionCreate).toHaveBeenNthCalledWith(1, {
      data: expect.objectContaining({
        quantity: 1,
        pricePerUnit: 100,
        note: "ล็อตแรก",
        type: "REMOVE",
      }),
    });
    expect(mocks.transactionCreate).toHaveBeenNthCalledWith(2, {
      data: expect.objectContaining({
        quantity: 2,
        pricePerUnit: 200,
        note: "ล็อตสอง",
        type: "REMOVE",
      }),
    });
    expect(mocks.itemDelete).toHaveBeenCalledWith({ where: { id: 7 } });
  });
});

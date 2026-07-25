import { PortfolioLotSource } from "@/generated/prisma/client";
import { describe, expect, it, vi } from "vitest";

import {
  appendPortfolioLot,
  deletePortfolioLot,
  getPortfolioLotAggregate,
  toOwnerPortfolioItemDto,
  updatePortfolioLot,
  updateSinglePortfolioLotCompatibility,
  type PortfolioLotValue,
} from "./lots";

const now = new Date("2026-07-23T00:00:00.000Z");

function lot(
  id: number,
  quantity: number,
  unitCostJpy: number | null,
): PortfolioLotValue {
  return {
    id,
    quantity,
    unitCostJpy,
    acquiredAt: null,
    note: null,
    source: PortfolioLotSource.MANUAL,
    createdAt: now,
    updatedAt: now,
  };
}

describe("portfolio lot aggregate", () => {
  it("keeps exact recorded cost while exposing a rounded compatibility average", () => {
    expect(
      getPortfolioLotAggregate({
        quantity: 99,
        purchasePrice: 999,
        lots: [lot(1, 1, 100), lot(2, 2, 200)],
      }),
    ).toEqual({
      quantity: 3,
      recordedCostJpy: 500,
      costedCopyCount: 3,
      lotCount: 2,
      purchasePrice: 167,
      usesLegacyFallback: false,
    });
  });

  it("keeps partial recorded cost but nulls the compatibility average", () => {
    expect(
      getPortfolioLotAggregate({
        quantity: 3,
        purchasePrice: 100,
        lots: [lot(1, 1, 100), lot(2, 2, null)],
      }),
    ).toEqual({
      quantity: 3,
      recordedCostJpy: 100,
      costedCopyCount: 1,
      lotCount: 2,
      purchasePrice: null,
      usesLegacyFallback: false,
    });
  });

  it("treats a zero unit cost as known coverage", () => {
    expect(
      getPortfolioLotAggregate({
        quantity: 2,
        purchasePrice: null,
        lots: [lot(1, 2, 0)],
      }),
    ).toMatchObject({
      recordedCostJpy: 0,
      costedCopyCount: 2,
      purchasePrice: 0,
    });
  });

  it("falls back to legacy parent fields when no lot row is available", () => {
    expect(
      getPortfolioLotAggregate({
        quantity: 2,
        purchasePrice: 125,
        lots: [],
      }),
    ).toEqual({
      quantity: 2,
      recordedCostJpy: 250,
      costedCopyCount: 2,
      lotCount: 0,
      purchasePrice: 125,
      usesLegacyFallback: true,
    });
  });

  it("serializes only the owner lot contract and exact aggregate fields", () => {
    const dto = toOwnerPortfolioItemDto({
      id: 7,
      quantity: 3,
      purchasePrice: 999,
      lots: [lot(1, 1, 100), lot(2, 2, null)],
    });

    expect(dto).toMatchObject({
      id: 7,
      quantity: 3,
      purchasePrice: null,
      lotCount: 2,
      recordedCostJpy: 100,
      costedCopyCount: 1,
    });
    expect(Object.keys(dto.lots[0])).toEqual([
      "id",
      "quantity",
      "unitCostJpy",
      "acquiredAt",
      "note",
      "source",
      "createdAt",
      "updatedAt",
    ]);
  });
});

describe("portfolio lot mutations", () => {
  function mutationTx() {
    const portfolioLot = {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    const portfolioItem = {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    return {
      tx: { portfolioLot, portfolioItem } as never,
      portfolioLot,
      portfolioItem,
    };
  }

  function item(lots: PortfolioLotValue[]) {
    return {
      id: 7,
      portfolioId: 1,
      cardId: 10,
      quantity: lots.reduce((sum, value) => sum + value.quantity, 0),
      purchasePrice: null,
      addedAt: now,
      lots,
    };
  }

  it("appends a differently priced lot and syncs parent compatibility fields", async () => {
    const { tx, portfolioLot, portfolioItem } = mutationTx();
    portfolioLot.create.mockResolvedValue(lot(2, 2, 200));
    portfolioItem.update.mockResolvedValue({ id: 7 });

    const result = await appendPortfolioLot(
      tx,
      { ...item([lot(1, 1, 100)]), purchasePrice: 100 },
      {
        quantity: 2,
        unitCostJpy: 200,
        acquiredAt: null,
        note: null,
      },
    );

    expect(result.aggregate).toMatchObject({
      quantity: 3,
      recordedCostJpy: 500,
      costedCopyCount: 3,
      purchasePrice: 167,
    });
    expect(portfolioItem.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { quantity: 3, purchasePrice: 167 },
    });
  });

  it("edits one lot and recalculates the exact holding aggregate", async () => {
    const { tx, portfolioLot, portfolioItem } = mutationTx();
    portfolioLot.update.mockResolvedValue(lot(2, 2, 250));
    portfolioItem.update.mockResolvedValue({ id: 7 });

    const result = await updatePortfolioLot(
      tx,
      item([lot(1, 1, 100), lot(2, 2, 200)]),
      2,
      { unitCostJpy: 250 },
    );

    expect(result.aggregate).toMatchObject({
      quantity: 3,
      recordedCostJpy: 600,
      purchasePrice: 200,
    });
    expect(portfolioItem.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { quantity: 3, purchasePrice: 200 },
    });
  });

  it.each([
    { label: "free", unitCostJpy: 0 },
    { label: "unknown", unitCostJpy: null },
  ])(
    "materializes and updates a legacy opening lot with a $label cost",
    async ({ unitCostJpy }) => {
      const { tx, portfolioLot, portfolioItem } = mutationTx();
      const openingLot = {
        ...lot(9, 2, null),
        source: PortfolioLotSource.LEGACY_OPENING_BALANCE,
      };
      portfolioLot.create.mockResolvedValue(openingLot);
      portfolioLot.update.mockImplementation(
        ({ data }: { data: Partial<PortfolioLotValue> }) => ({
          ...openingLot,
          ...data,
        }),
      );
      portfolioItem.update.mockResolvedValue({ id: 7 });

      const result = await updateSinglePortfolioLotCompatibility(
        tx,
        {
          ...item([]),
          quantity: 2,
          purchasePrice: null,
        },
        {
          quantity: 3,
          unitCostJpy,
          acquiredAt: new Date("2026-07-12T00:00:00.000Z"),
          note: "ยอดตั้งต้น",
        },
      );

      expect(portfolioLot.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          portfolioItemId: 7,
          quantity: 2,
          unitCostJpy: null,
          source: PortfolioLotSource.LEGACY_OPENING_BALANCE,
        }),
        select: expect.any(Object),
      });
      expect(portfolioLot.update).toHaveBeenCalledWith({
        where: { id: 9 },
        data: {
          quantity: 3,
          unitCostJpy,
          acquiredAt: new Date("2026-07-12T00:00:00.000Z"),
          note: "ยอดตั้งต้น",
        },
        select: expect.any(Object),
      });
      expect(result.lot.unitCostJpy).toBe(unitCostJpy);
      expect(result.lot.note).toBe("ยอดตั้งต้น");
    },
  );

  it("deletes one lot but keeps and resyncs a parent with remaining lots", async () => {
    const { tx, portfolioLot, portfolioItem } = mutationTx();
    portfolioLot.delete.mockResolvedValue({ id: 2 });
    portfolioItem.update.mockResolvedValue({ id: 7 });

    const result = await deletePortfolioLot(
      tx,
      item([lot(1, 1, 100), lot(2, 2, 200)]),
      2,
    );

    expect(result.deletedItem).toBe(false);
    expect(portfolioItem.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { quantity: 1, purchasePrice: 100 },
    });
    expect(portfolioItem.delete).not.toHaveBeenCalled();
  });

  it("deletes the parent only after its final lot is removed", async () => {
    const { tx, portfolioLot, portfolioItem } = mutationTx();
    portfolioLot.delete.mockResolvedValue({ id: 1 });
    portfolioItem.delete.mockResolvedValue({ id: 7 });

    const result = await deletePortfolioLot(
      tx,
      item([lot(1, 1, 100)]),
      1,
    );

    expect(result.deletedItem).toBe(true);
    expect(portfolioItem.delete).toHaveBeenCalledWith({ where: { id: 7 } });
    expect(portfolioItem.update).not.toHaveBeenCalled();
  });
});

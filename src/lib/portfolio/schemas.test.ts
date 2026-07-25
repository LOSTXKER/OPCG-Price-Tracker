import { describe, expect, it } from "vitest";

import {
  CreatePortfolioItemSchema,
  CreatePortfolioLotSchema,
  CreatePortfolioItemsBatchSchema,
  CreatePortfolioSchema,
  CreatePortfolioTransactionSchema,
  UpdatePortfolioItemSchema,
  UpdatePortfolioLotSchema,
} from "./schemas";

describe("portfolio schemas", () => {
  it("requires an explicit privacy choice when creating a portfolio", () => {
    expect(CreatePortfolioSchema.safeParse({ name: "Main" }).success).toBe(false);
    expect(
      CreatePortfolioSchema.safeParse({ name: "Main", isPublic: false }).success,
    ).toBe(true);
  });

  it("rejects duplicate card-condition rows inside one batch", () => {
    const result = CreatePortfolioItemsBatchSchema.safeParse({
      portfolioId: 1,
      requestId: "123e4567-e89b-42d3-a456-426614174000",
      items: [
        {
          cardId: 10,
          quantity: 1,
          purchasePrice: 100,
          acquiredAt: "2026-07-23",
          condition: "NM",
        },
        {
          cardId: 10,
          quantity: 2,
          purchasePrice: 200,
          acquiredAt: "2026-07-24",
          condition: "NM",
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("accepts the acquisition lot input contract and rejects impossible dates", () => {
    expect(
      CreatePortfolioLotSchema.safeParse({
        quantity: 2,
        unitCostJpy: 0,
        acquiredAt: "2026-07-23",
        note: "ร้าน A",
      }).success,
    ).toBe(true);
    expect(
      CreatePortfolioLotSchema.safeParse({
        quantity: 1,
        unitCostJpy: 100,
        acquiredAt: "2026-02-30",
      }).success,
    ).toBe(false);
  });

  it("accepts purchase-lot metadata when creating a portfolio item", () => {
    const result = CreatePortfolioItemSchema.safeParse({
      portfolioId: 1,
      cardId: 10,
      quantity: 2,
      purchasePrice: 150,
      acquiredAt: "2026-07-23",
      lotNote: "  ร้าน A  ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.lotNote).toBe("ร้าน A");
    }
    expect(
      CreatePortfolioItemSchema.safeParse({
        portfolioId: 1,
        cardId: 10,
        purchasePrice: 150,
        acquiredAt: "2026-07-23",
        lotNote: "x".repeat(2001),
      }).success,
    ).toBe(false);
  });

  it("requires real date and cost values for every new acquisition", () => {
    const validItem = {
      portfolioId: 1,
      cardId: 10,
      quantity: 1,
      purchasePrice: 0,
      acquiredAt: "2026-07-23",
    };
    expect(CreatePortfolioItemSchema.safeParse(validItem).success).toBe(true);
    expect(
      CreatePortfolioItemSchema.safeParse({
        ...validItem,
        purchasePrice: null,
      }).success,
    ).toBe(false);
    expect(
      CreatePortfolioItemSchema.safeParse({
        ...validItem,
        purchasePrice: "",
      }).success,
    ).toBe(false);
    expect(
      CreatePortfolioItemSchema.safeParse({
        ...validItem,
        acquiredAt: null,
      }).success,
    ).toBe(false);
    expect(
      CreatePortfolioItemSchema.safeParse({
        ...validItem,
        acquiredAt: "",
      }).success,
    ).toBe(false);

    expect(
      CreatePortfolioLotSchema.safeParse({
        quantity: 1,
        unitCostJpy: 0,
        acquiredAt: "2026-07-23",
      }).success,
    ).toBe(true);
    expect(
      CreatePortfolioLotSchema.safeParse({
        quantity: 1,
        unitCostJpy: null,
        acquiredAt: "2026-07-23",
      }).success,
    ).toBe(false);
    expect(
      CreatePortfolioLotSchema.safeParse({
        quantity: 1,
        unitCostJpy: 100,
        acquiredAt: null,
      }).success,
    ).toBe(false);
  });

  it("requires at least one recognized lot field and caps notes at 2,000 chars", () => {
    expect(UpdatePortfolioLotSchema.safeParse({}).success).toBe(false);
    expect(
      UpdatePortfolioLotSchema.safeParse({ note: "x".repeat(2001) }).success,
    ).toBe(false);
    const nullableCost = UpdatePortfolioLotSchema.safeParse({
      unitCostJpy: null,
    });
    expect(nullableCost.success).toBe(true);
    if (nullableCost.success) {
      expect(nullableCost.data.unitCostJpy).toBeNull();
    }
    expect(
      UpdatePortfolioLotSchema.safeParse({ unitCostJpy: "" }).success,
    ).toBe(false);
  });

  it("accepts one validated compatibility patch for the legacy opening row", () => {
    const result = UpdatePortfolioItemSchema.safeParse({
      quantity: 2,
      purchasePrice: 0,
      acquiredAt: "2026-07-23",
      lotNote: "  ซื้อก่อนระบบล็อต  ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({
        quantity: 2,
        purchasePrice: 0,
        acquiredAt: "2026-07-23",
        lotNote: "ซื้อก่อนระบบล็อต",
      });
    }
    expect(
      UpdatePortfolioItemSchema.safeParse({
        purchasePrice: null,
        acquiredAt: null,
        lotNote: null,
      }).success,
    ).toBe(true);
    expect(
      UpdatePortfolioItemSchema.safeParse({
        acquiredAt: "2026-02-30",
      }).success,
    ).toBe(false);
    expect(
      UpdatePortfolioItemSchema.safeParse({ unknownField: true }).success,
    ).toBe(false);
  });

  it("keeps transaction validation aligned with the database enum", () => {
    const baseTransaction = {
      portfolioId: 1,
      cardId: 10,
      quantity: 1,
    };

    expect(
      CreatePortfolioTransactionSchema.safeParse({
        ...baseTransaction,
        type: "BUY",
      }).success,
    ).toBe(true);
    expect(
      CreatePortfolioTransactionSchema.safeParse({
        ...baseTransaction,
        type: "REMOVE",
      }).success,
    ).toBe(true);
    expect(
      CreatePortfolioTransactionSchema.safeParse({
        ...baseTransaction,
        type: "SELL",
      }).success,
    ).toBe(false);
    expect(
      CreatePortfolioTransactionSchema.safeParse({
        ...baseTransaction,
        type: "ADJUST",
      }).success,
    ).toBe(false);
  });
});

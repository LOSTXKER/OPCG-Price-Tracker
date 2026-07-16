import { describe, expect, it } from "vitest";

import {
  CreatePortfolioItemsBatchSchema,
  CreatePortfolioSchema,
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
        { cardId: 10, quantity: 1, condition: "NM" },
        { cardId: 10, quantity: 2, condition: "NM" },
      ],
    });

    expect(result.success).toBe(false);
  });
});

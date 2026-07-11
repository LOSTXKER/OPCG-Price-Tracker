import { describe, expect, it } from "vitest";

import {
  CheckoutRequestSchema,
  checkoutPlanFor,
  parseCheckoutPlan,
} from "./schemas";

describe("checkout plan validation", () => {
  it("accepts plans that the pricing cards can submit", () => {
    expect(parseCheckoutPlan("PRO_MONTHLY")).toBe("PRO_MONTHLY");
    expect(parseCheckoutPlan("PRO_PLUS_YEARLY")).toBe("PRO_PLUS_YEARLY");
  });

  it("rejects unknown URL and API plan values", () => {
    expect(parseCheckoutPlan("LIFETIME_PRO")).toBeNull();
    expect(CheckoutRequestSchema.safeParse({ plan: "FREE" }).success).toBe(false);
  });

  it("keeps a resumed checkout aligned with the visible billing cadence", () => {
    expect(checkoutPlanFor("PRO", "yearly")).toBe("PRO_YEARLY");
    expect(checkoutPlanFor("PRO", "monthly")).toBe("PRO_MONTHLY");
    expect(checkoutPlanFor("PRO_PLUS", "yearly")).toBe("PRO_PLUS_YEARLY");
    expect(checkoutPlanFor("PRO_PLUS", "monthly")).toBe("PRO_PLUS_MONTHLY");
  });
});

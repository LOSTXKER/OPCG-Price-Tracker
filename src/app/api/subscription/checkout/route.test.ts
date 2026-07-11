import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuthUser: vi.fn(),
  userUpdate: vi.fn(),
  customerCreate: vi.fn(),
  checkoutCreate: vi.fn(),
}));

vi.mock("@/lib/api/auth", () => ({
  requireAuthUser: mocks.requireAuthUser,
}));

vi.mock("@/lib/db", () => ({
  prisma: { user: { update: mocks.userUpdate } },
}));

vi.mock("@/lib/env", () => ({
  clientEnv: () => ({ NEXT_PUBLIC_APP_URL: "https://meecard.test" }),
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    customers: { create: mocks.customerCreate },
    checkout: { sessions: { create: mocks.checkoutCreate } },
  },
  STRIPE_PLANS: {
    PRO_MONTHLY: { priceId: "price_pro_monthly" },
  },
}));

import { POST } from "./route";

describe("subscription checkout route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthUser.mockResolvedValue({
      ok: true,
      user: {
        id: "user_1",
        email: "user@example.com",
        displayName: "User",
        tier: "FREE",
        stripeCustomerId: "cus_1",
        stripeSubscriptionId: null,
      },
    });
    mocks.checkoutCreate.mockResolvedValue({
      url: "https://checkout.stripe.test/session",
    });
  });

  it("limits recurring checkout to immediate card payments", async () => {
    const request = new NextRequest(
      "https://meecard.test/api/subscription/checkout",
      {
        method: "POST",
        body: JSON.stringify({ plan: "PRO_MONTHLY" }),
        headers: { "content-type": "application/json" },
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mocks.checkoutCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: "price_pro_monthly", quantity: 1 }],
      }),
    );
  });
});

import type Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  userUpdate: vi.fn(),
  userUpdateMany: vi.fn(),
  subscriptionRetrieve: vi.fn(),
  subscriptionCancel: vi.fn(),
  invoiceRetrieve: vi.fn(),
  refundCreate: vi.fn(),
  warn: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: mocks.userFindUnique,
      update: mocks.userUpdate,
      updateMany: mocks.userUpdateMany,
    },
  },
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    subscriptions: {
      retrieve: mocks.subscriptionRetrieve,
      cancel: mocks.subscriptionCancel,
    },
    invoices: { retrieve: mocks.invoiceRetrieve },
    refunds: { create: mocks.refundCreate },
  },
  planByPriceId: vi.fn(() => ({ tier: "PRO" })),
}));

vi.mock("@/lib/logger", () => ({
  createLog: () => ({ warn: mocks.warn, error: vi.fn() }),
}));

import { dispatchStripeEvent } from "./stripe-webhook";

describe("Stripe webhook lifetime safety", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.userUpdate.mockResolvedValue({});
    mocks.userUpdateMany.mockResolvedValue({ count: 1 });
    mocks.subscriptionCancel.mockResolvedValue({ status: "canceled" });
    mocks.refundCreate.mockResolvedValue({ id: "re_1" });
  });

  it("cancels and refunds checkout created before Lifetime access", async () => {
    mocks.userFindUnique.mockResolvedValue({ tier: "LIFETIME_PRO" });
    mocks.subscriptionRetrieve.mockResolvedValue({
      id: "sub_1",
      status: "active",
      latest_invoice: "in_1",
    });
    mocks.invoiceRetrieve.mockResolvedValue({
      payments: {
        data: [
          {
            id: "ip_1",
            status: "paid",
            amount_paid: 12900,
            payment: { payment_intent: "pi_1", type: "payment_intent" },
          },
        ],
      },
    });

    await dispatchStripeEvent({
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_1",
          metadata: { userId: "user_1" },
          subscription: "sub_1",
          invoice: "in_1",
        },
      },
    } as unknown as Stripe.Event);

    expect(mocks.subscriptionCancel).toHaveBeenCalledWith("sub_1");
    expect(mocks.refundCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_intent: "pi_1",
        amount: 12900,
        reason: "requested_by_customer",
      }),
      { idempotencyKey: "lifetime-checkout-refund:cs_1:ip_1" },
    );
    expect(mocks.userUpdate).not.toHaveBeenCalled();
  });

  it("clears the Stripe id without downgrading Lifetime on deletion", async () => {
    mocks.userFindUnique.mockResolvedValue({
      id: "user_1",
      tier: "LIFETIME_PRO_PLUS",
    });

    await dispatchStripeEvent({
      type: "customer.subscription.deleted",
      data: { object: { id: "sub_1", customer: "cus_1" } },
    } as unknown as Stripe.Event);

    expect(mocks.userUpdateMany).toHaveBeenCalledWith({
      where: { id: "user_1", stripeSubscriptionId: "sub_1" },
      data: { stripeSubscriptionId: null },
    });
  });

  it("does not downgrade a replacement subscription from a stale deletion event", async () => {
    mocks.userFindUnique.mockResolvedValue({
      id: "user_1",
      tier: "PRO",
      stripeSubscriptionId: "sub_new",
    });
    mocks.userUpdateMany.mockResolvedValue({ count: 0 });

    await dispatchStripeEvent({
      type: "customer.subscription.deleted",
      data: { object: { id: "sub_old", customer: "cus_1" } },
    } as unknown as Stripe.Event);

    expect(mocks.userUpdateMany).toHaveBeenCalledWith({
      where: { id: "user_1", stripeSubscriptionId: "sub_old" },
      data: { tier: "FREE", stripeSubscriptionId: null },
    });
    expect(mocks.userUpdate).not.toHaveBeenCalled();
  });
});

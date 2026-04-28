import type Stripe from "stripe";
import type { UserTier } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { stripe, planByPriceId } from "@/lib/stripe";
import { createLog } from "@/lib/logger";

const log = createLog("webhook:stripe");

function getPeriodEnd(
  sub: { items: { data: { current_period_end?: number }[] } },
): Date | null {
  const endTs = sub.items.data[0]?.current_period_end;
  return endTs ? new Date(endTs * 1000) : null;
}

function tierFromPriceId(priceId: string | undefined): UserTier {
  if (!priceId) return "PRO";
  const plan = planByPriceId(priceId);
  return plan?.tier === "PRO_PLUS" ? "PRO_PLUS" : "PRO";
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) return;

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.toString();
  if (!subscriptionId) return;

  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const tier = tierFromPriceId(sub.items.data[0]?.price.id);

  await prisma.user.update({
    where: { id: userId },
    data: {
      tier,
      stripeSubscriptionId: subscriptionId,
      tierExpiresAt: getPeriodEnd(sub),
    },
  });
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer?.toString();
  if (!customerId) return;

  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
  });
  if (!user) return;

  if (sub.status !== "active" && sub.status !== "trialing") return;

  const tier = tierFromPriceId(sub.items.data[0]?.price.id);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      tier,
      tierExpiresAt: getPeriodEnd(sub),
      stripeSubscriptionId: sub.id,
    },
  });
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer?.toString();
  if (!customerId) return;

  await prisma.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: { tier: "FREE", stripeSubscriptionId: null },
  });
}

function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.toString();
  if (!customerId) return;
  log.warn("Payment failed for customer", customerId);
}

/**
 * Dispatch a verified Stripe event to the right handler. Designed for the
 * `/api/webhooks/stripe` route — keep handlers idempotent (Stripe will retry).
 */
export async function dispatchStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(event.data.object);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object);
      break;
    case "invoice.payment_failed":
      handlePaymentFailed(event.data.object);
      break;
  }
}

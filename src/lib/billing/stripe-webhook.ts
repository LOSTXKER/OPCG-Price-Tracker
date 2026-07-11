import type Stripe from "stripe";
import type { UserTier } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { stripe, planByPriceId } from "@/lib/stripe";
import { createLog } from "@/lib/logger";
import { isLifetime } from "@/lib/billing/limits";

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

async function cancelAndRefundLifetimeCheckout(
  session: Stripe.Checkout.Session,
  subscriptionId: string,
) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  if (subscription.status !== "canceled") {
    await stripe.subscriptions.cancel(subscriptionId);
  }

  const invoiceRef = session.invoice ?? subscription.latest_invoice;
  const invoiceId =
    typeof invoiceRef === "string" ? invoiceRef : invoiceRef?.id;
  if (!invoiceId) {
    log.warn("Lifetime checkout canceled without an invoice to refund", session.id);
    return;
  }

  const invoice = await stripe.invoices.retrieve(invoiceId, {
    expand: ["payments.data.payment.payment_intent"],
  });
  const paidPayments =
    invoice.payments?.data.filter(
      (payment) => payment.status === "paid" && (payment.amount_paid ?? 0) > 0,
    ) ?? [];

  for (const payment of paidPayments) {
    const paymentIntent = payment.payment.payment_intent;
    const charge = payment.payment.charge;
    const params: Stripe.RefundCreateParams | null = paymentIntent
      ? {
          payment_intent:
            typeof paymentIntent === "string" ? paymentIntent : paymentIntent.id,
          amount: payment.amount_paid ?? undefined,
          reason: "requested_by_customer",
          metadata: { reason: "lifetime_plan_checkout_race", sessionId: session.id },
        }
      : charge
        ? {
            charge: typeof charge === "string" ? charge : charge.id,
            amount: payment.amount_paid ?? undefined,
            reason: "requested_by_customer",
            metadata: { reason: "lifetime_plan_checkout_race", sessionId: session.id },
          }
        : null;
    if (!params) continue;
    await stripe.refunds.create(params, {
      idempotencyKey: `lifetime-checkout-refund:${session.id}:${payment.id}`,
    });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) return;

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.toString();
  if (!subscriptionId) return;

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true },
  });
  if (!currentUser || isLifetime(currentUser.tier)) {
    if (currentUser) {
      log.warn("Canceling checkout created before Lifetime access", userId);
      await cancelAndRefundLifetimeCheckout(session, subscriptionId);
    }
    return;
  }

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
  if (isLifetime(user.tier)) {
    if (sub.status !== "canceled") await stripe.subscriptions.cancel(sub.id);
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeSubscriptionId: null },
    });
    log.warn("Canceled recurring subscription for lifetime user", user.id);
    return;
  }

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

  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
    select: { id: true, tier: true },
  });
  if (!user) return;

  await prisma.user.updateMany({
    where: { id: user.id, stripeSubscriptionId: sub.id },
    data: isLifetime(user.tier)
      ? { stripeSubscriptionId: null }
      : { tier: "FREE", stripeSubscriptionId: null },
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

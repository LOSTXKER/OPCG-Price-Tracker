import { NextResponse } from "next/server";
import { stripe, planByPriceId } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { serverEnv } from "@/lib/env";
import { createLog } from "@/lib/logger";
import type { UserTier } from "@/generated/prisma/client";

const log = createLog("webhook:stripe");

function getPeriodEnd(sub: { items: { data: { current_period_end?: number }[] } }): Date | null {
  const endTs = sub.items.data[0]?.current_period_end;
  return endTs ? new Date(endTs * 1000) : null;
}

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  const webhookSecret = serverEnv().STRIPE_WEBHOOK_SECRET;
  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    log.error("signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      if (!userId) break;

      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.toString();

      if (subscriptionId) {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = sub.items.data[0]?.price.id;
        const plan = priceId ? planByPriceId(priceId) : null;
        const tier: UserTier = plan?.tier === "PRO_PLUS" ? "PRO_PLUS" : "PRO";

        await prisma.user.update({
          where: { id: userId },
          data: {
            tier,
            stripeSubscriptionId: subscriptionId,
            tierExpiresAt: getPeriodEnd(sub),
          },
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.toString();
      if (!customerId) break;

      const user = await prisma.user.findUnique({ where: { stripeCustomerId: customerId } });
      if (!user) break;

      const priceId = sub.items.data[0]?.price.id;
      const plan = priceId ? planByPriceId(priceId) : null;

      if (sub.status === "active" || sub.status === "trialing") {
        const tier: UserTier = plan?.tier === "PRO_PLUS" ? "PRO_PLUS" : "PRO";
        await prisma.user.update({
          where: { id: user.id },
          data: {
            tier,
            tierExpiresAt: getPeriodEnd(sub),
            stripeSubscriptionId: sub.id,
          },
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.toString();
      if (!customerId) break;

      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: { tier: "FREE", stripeSubscriptionId: null },
      });
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.toString();
      if (!customerId) break;

      log.warn("Payment failed for customer", customerId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}

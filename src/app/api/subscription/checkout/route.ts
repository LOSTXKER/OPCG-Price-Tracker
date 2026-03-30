import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import { clientEnv } from "@/lib/env";
import { stripe, STRIPE_PLANS, type PlanKey } from "@/lib/stripe";

export async function POST(request: Request) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const user = auth.user;

  const parsed = await parseJsonBody<{ plan: PlanKey }>(request as never);
  if (!parsed.ok) return parsed.response;

  const planConfig = STRIPE_PLANS[parsed.body.plan];
  if (!planConfig) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  let customerId = user.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.displayName ?? undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const baseUrl = clientEnv().NEXT_PUBLIC_APP_URL;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: planConfig.priceId, quantity: 1 }],
    success_url: `${baseUrl}/profile?tab=subscription&subscription=success`,
    cancel_url: `${baseUrl}/pricing?cancelled=true`,
    metadata: { userId: user.id, plan: parsed.body.plan },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}

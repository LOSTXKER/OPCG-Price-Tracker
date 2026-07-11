import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/api/auth";
import { apiHandler } from "@/lib/api/api-handler";
import { parseJsonBody } from "@/lib/api/request-body";
import { CheckoutRequestSchema } from "@/lib/billing/schemas";
import { isLifetime } from "@/lib/billing/limits";
import { prisma } from "@/lib/db";
import { clientEnv } from "@/lib/env";
import { stripe, STRIPE_PLANS } from "@/lib/stripe";

export const POST = apiHandler(async (request) => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const user = auth.user;

  if (isLifetime(user.tier)) {
    return NextResponse.json(
      { error: "Lifetime plans cannot be replaced by a recurring subscription" },
      { status: 403 },
    );
  }

  if (user.stripeSubscriptionId) {
    return NextResponse.json(
      { error: "Manage the existing subscription before choosing another plan" },
      { status: 409 },
    );
  }

  const parsed = await parseJsonBody(request, CheckoutRequestSchema);
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
  const successUrl = new URL("/settings/subscription", baseUrl);
  successUrl.searchParams.set("subscription", "success");
  const cancelUrl = new URL("/pricing", baseUrl);
  cancelUrl.searchParams.set("cancelled", "true");
  cancelUrl.searchParams.set("selected", parsed.body.plan);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: planConfig.priceId, quantity: 1 }],
    success_url: successUrl.toString(),
    cancel_url: cancelUrl.toString(),
    metadata: { userId: user.id, plan: parsed.body.plan },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
});

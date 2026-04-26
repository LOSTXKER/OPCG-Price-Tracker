import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/api/auth";
import { apiHandler } from "@/lib/api/api-handler";
import { stripe } from "@/lib/stripe";
import { clientEnv } from "@/lib/env";

export const POST = apiHandler(async () => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const user = auth.user;

  if (!user.stripeCustomerId) {
    return NextResponse.json({ error: "No subscription found" }, { status: 400 });
  }

  const baseUrl = clientEnv().NEXT_PUBLIC_APP_URL;

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${baseUrl}/settings/subscription`,
  });

  return NextResponse.json({ url: session.url });
});

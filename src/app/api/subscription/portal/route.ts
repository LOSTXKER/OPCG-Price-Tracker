import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/api/auth";
import { stripe } from "@/lib/stripe";
import { clientEnv } from "@/lib/env";

export async function POST() {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const user = auth.user;

  if (!user.stripeCustomerId) {
    return NextResponse.json({ error: "No subscription found" }, { status: 400 });
  }

  const baseUrl = clientEnv().NEXT_PUBLIC_APP_URL;

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${baseUrl}/profile?tab=subscription`,
  });

  return NextResponse.json({ url: session.url });
}

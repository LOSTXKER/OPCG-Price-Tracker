import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/api/auth";
import { getStripe } from "@/lib/stripe";
import { createLog } from "@/lib/logger";

const log = createLog("api:me:payment-method");

export async function GET() {
  try {
    const auth = await requireAuthUser();
    if (!auth.ok) return auth.response;

    const { stripeCustomerId } = auth.user;
    if (!stripeCustomerId) {
      return NextResponse.json({ paymentMethod: null });
    }

    const stripe = getStripe();
    const methods = await stripe.customers.listPaymentMethods(stripeCustomerId, {
      type: "card",
      limit: 1,
    });

    const card = methods.data[0]?.card;
    if (!card) {
      return NextResponse.json({ paymentMethod: null });
    }

    return NextResponse.json({
      paymentMethod: {
        brand: card.brand,
        last4: card.last4,
        expMonth: card.exp_month,
        expYear: card.exp_year,
      },
    });
  } catch (error) {
    log.error("GET /api/me/payment-method", error);
    return NextResponse.json({ paymentMethod: null });
  }
}

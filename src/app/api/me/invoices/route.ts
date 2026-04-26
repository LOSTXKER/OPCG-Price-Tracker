import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api/api-handler";
import { requireAuthUser } from "@/lib/api/auth";
import { getStripe } from "@/lib/stripe";
import { createLog } from "@/lib/logger";

const log = createLog("api:me:invoices");

export const GET = apiHandler(async () => {
  try {
    const auth = await requireAuthUser();
    if (!auth.ok) return auth.response;

    const { stripeCustomerId } = auth.user;
    if (!stripeCustomerId) {
      return NextResponse.json({ invoices: [] });
    }

    const stripe = getStripe();
    const result = await stripe.invoices.list({
      customer: stripeCustomerId,
      limit: 10,
      status: "paid",
    });

    const invoices = result.data.map((inv) => ({
      id: inv.id,
      number: inv.number,
      amountPaid: inv.amount_paid,
      currency: inv.currency,
      status: inv.status,
      created: inv.created,
      pdfUrl: inv.invoice_pdf,
      hostedUrl: inv.hosted_invoice_url,
    }));

    return NextResponse.json({ invoices });
  } catch (error) {
    log.error("GET /api/me/invoices", error);
    return NextResponse.json({ invoices: [] });
  }
});

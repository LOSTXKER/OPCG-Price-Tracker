import { NextRequest, NextResponse } from "next/server";

import { apiHandler } from "@/lib/api/api-handler";
import { findCardByCode } from "@/lib/data/card-detail";
import { prisma } from "@/lib/db";

/**
 * View counter for the card page.
 *
 * The increment used to run inside the card page's render, which forced the
 * route to be dynamic AND wrote a row to the DB on every crawler hit (thousands
 * a day). It now lives here and is called fire-and-forget from the browser, so
 * the page itself can be ISR-cached and bots no longer inflate the counter.
 */
export const POST = apiHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) => {
  const { code } = await params;

  const card = await findCardByCode(code, { select: { id: true } });
  if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });

  await prisma.card.update({
    where: { id: card.id },
    data: { viewCount: { increment: 1 } },
  });

  return NextResponse.json({ ok: true });
});

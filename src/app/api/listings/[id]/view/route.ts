import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api/api-handler";
import { prisma } from "@/lib/db";
import { guardMarketplaceApi } from "@/lib/marketplace/feature-flag";

type Params = { params: Promise<{ id: string }> };

export const POST = apiHandler(async (_request: NextRequest, props: Params) => {
  const blocked = await guardMarketplaceApi();
  if (blocked) return blocked;

  const { id } = await props.params;
  const listingId = parseInt(id, 10);
  if (isNaN(listingId)) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  await prisma.listing
    .update({ where: { id: listingId }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});

  return NextResponse.json({ ok: true });
});

import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api/api-handler";
import { requireAuthUser } from "@/lib/api/auth";
import { prisma } from "@/lib/db";
import { guardMarketplaceApi } from "@/lib/marketplace/feature-flag";

type Params = { params: Promise<{ id: string }> };

export const POST = apiHandler(async (_request: NextRequest, props: Params) => {
  const blocked = await guardMarketplaceApi();
  if (blocked) return blocked;

  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const user = auth.user;

  const { id } = await props.params;
  const listingId = parseInt(id, 10);
  if (isNaN(listingId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const existing = await prisma.savedListing.findUnique({
    where: { userId_listingId: { userId: user.id, listingId } },
  });

  if (existing) {
    await prisma.savedListing.delete({ where: { id: existing.id } });
    return NextResponse.json({ saved: false });
  }

  await prisma.savedListing.create({
    data: { userId: user.id, listingId },
  });
  return NextResponse.json({ saved: true });
});

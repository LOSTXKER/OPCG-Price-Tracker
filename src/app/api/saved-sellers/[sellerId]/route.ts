import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/api/auth";
import { apiHandler } from "@/lib/api/api-handler";
import { prisma } from "@/lib/db";
import { guardMarketplaceApi } from "@/lib/marketplace/feature-flag";

type Ctx = { params: Promise<{ sellerId: string }> };

export const POST = apiHandler(async (_req, { params }: Ctx) => {
  const blocked = await guardMarketplaceApi();
  if (blocked) return blocked;

  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const { sellerId } = await params;

  if (!sellerId || typeof sellerId !== "string") {
    return NextResponse.json({ error: "Invalid sellerId" }, { status: 400 });
  }
  if (sellerId === auth.user.id) {
    return NextResponse.json(
      { error: "Cannot save yourself" },
      { status: 400 },
    );
  }

  const seller = await prisma.user.findUnique({
    where: { id: sellerId },
    select: { id: true },
  });
  if (!seller) {
    return NextResponse.json({ error: "Seller not found" }, { status: 404 });
  }

  await prisma.savedSeller.upsert({
    where: {
      userId_sellerId: { userId: auth.user.id, sellerId },
    },
    update: {},
    create: { userId: auth.user.id, sellerId },
  });

  return NextResponse.json({ saved: true });
});

export const DELETE = apiHandler(async (_req, { params }: Ctx) => {
  const blocked = await guardMarketplaceApi();
  if (blocked) return blocked;

  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const { sellerId } = await params;

  await prisma.savedSeller.deleteMany({
    where: { userId: auth.user.id, sellerId },
  });

  return NextResponse.json({ saved: false });
});

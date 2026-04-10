import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/api/auth";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, props: Params) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, props: Params) {
  const { id } = await props.params;
  const listingId = parseInt(id, 10);
  if (isNaN(listingId)) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  await prisma.listing
    .update({ where: { id: listingId }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});

  return NextResponse.json({ ok: true });
}

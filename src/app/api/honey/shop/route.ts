import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const items = await prisma.honeyShopItem.findMany({
    where: { isActive: true },
    orderBy: { cost: "asc" },
  });

  return NextResponse.json({ items });
}

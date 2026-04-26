import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api/api-handler";
import { prisma } from "@/lib/db";

export const GET = apiHandler(async () => {
  const items = await prisma.honeyShopItem.findMany({
    where: { isActive: true },
    orderBy: { cost: "asc" },
  });

  return NextResponse.json({ items });
});

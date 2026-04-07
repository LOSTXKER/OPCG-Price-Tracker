import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/api/admin-helpers";
import { adminApiHandler } from "@/lib/api/api-handler";
import { prisma } from "@/lib/db";
import type { ShopItemType } from "@/generated/prisma/client";

const VALID_TYPES = new Set(["TRIAL_PRO", "TRIAL_PRO_PLUS", "BADGE", "CUSTOM", "PROFILE_FRAME", "PRICE_ALERT_SLOT", "CSV_EXPORT_PASS"]);

export const GET = adminApiHandler(async (_req: NextRequest) => {
  const items = await prisma.honeyShopItem.findMany({
    orderBy: [{ isActive: "desc" }, { cost: "asc" }],
  });
  return NextResponse.json({ items });
});

export const POST = adminApiHandler(async (request: NextRequest) => {
  const parsed = await parseJsonBody<{
    name: string;
    nameEn?: string;
    nameTh?: string;
    description?: string;
    cost: number;
    type: string;
    value?: unknown;
    isActive?: boolean;
    stock?: number | null;
  }>(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  if (!body.name || typeof body.name !== "string") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (!Number.isInteger(body.cost) || body.cost < 1) {
    return NextResponse.json({ error: "cost must be a positive integer" }, { status: 400 });
  }
  if (!VALID_TYPES.has(body.type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const item = await prisma.honeyShopItem.create({
    data: {
      name: body.name,
      nameEn: body.nameEn ?? null,
      nameTh: body.nameTh ?? null,
      description: body.description ?? null,
      cost: body.cost,
      type: body.type as ShopItemType,
      value: body.value != null ? body.value as object : undefined,
      isActive: body.isActive ?? true,
      stock: body.stock ?? null,
    },
  });

  return NextResponse.json({ item }, { status: 201 });
});

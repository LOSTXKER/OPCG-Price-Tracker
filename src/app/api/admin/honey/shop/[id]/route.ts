import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/api/admin-helpers";
import { adminApiHandler } from "@/lib/api/api-handler";
import { prisma } from "@/lib/db";
import type { ShopItemType } from "@/generated/prisma/client";

type Ctx = { params: Promise<{ id: string }> };

const VALID_TYPES = new Set<ShopItemType>([
  "TRIAL_PRO",
  "TRIAL_PRO_PLUS",
  "BADGE",
  "CUSTOM",
  "PROFILE_FRAME",
  "PRICE_ALERT_SLOT",
  "CSV_EXPORT_PASS",
] as ShopItemType[]);

export const GET = adminApiHandler(async (_req: NextRequest, _admin, ctx: Ctx) => {
  const { id } = await ctx.params;
  const item = await prisma.honeyShopItem.findUnique({ where: { id: Number(id) } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ item });
});

export const PATCH = adminApiHandler(async (req: NextRequest, _admin, ctx: Ctx) => {
  const { id } = await ctx.params;
  const parsed = await parseJsonBody<{
    name?: string;
    nameEn?: string | null;
    nameTh?: string | null;
    description?: string | null;
    cost?: number;
    type?: string;
    value?: unknown;
    isActive?: boolean;
    stock?: number | null;
  }>(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  if (body.cost !== undefined && (!Number.isInteger(body.cost) || body.cost < 1)) {
    return NextResponse.json({ error: "cost must be a positive integer" }, { status: 400 });
  }
  if (body.type !== undefined && !VALID_TYPES.has(body.type as ShopItemType)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.nameEn !== undefined) data.nameEn = body.nameEn;
  if (body.nameTh !== undefined) data.nameTh = body.nameTh;
  if (body.description !== undefined) data.description = body.description;
  if (body.cost !== undefined) data.cost = body.cost;
  if (body.type !== undefined) data.type = body.type as ShopItemType;
  // `value` is JSON; passing `null` clears it. We use `=== null` explicitly so
  // an absent field doesn't accidentally wipe an existing value.
  if (body.value !== undefined) data.value = body.value === null ? null : (body.value as object);
  if (body.isActive !== undefined) data.isActive = body.isActive;
  if (body.stock !== undefined) data.stock = body.stock;

  const item = await prisma.honeyShopItem.update({
    where: { id: Number(id) },
    data,
  });

  return NextResponse.json({ item });
});

export const DELETE = adminApiHandler(async (_req: NextRequest, _admin, ctx: Ctx) => {
  const { id } = await ctx.params;
  // Soft-delete by deactivating: shop items can be referenced by historical
  // honey transactions / user badges, so we never hard-delete.
  const item = await prisma.honeyShopItem.update({
    where: { id: Number(id) },
    data: { isActive: false },
  });
  return NextResponse.json({ item });
});

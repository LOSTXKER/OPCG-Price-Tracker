import { NextRequest, NextResponse } from "next/server";
import { unauthorized, parseJsonBody } from "@/lib/api/admin-helpers";
import { checkIsAdmin } from "@/lib/auth/check-admin";
import { prisma } from "@/lib/db";
import type { Prisma, ShopItemType } from "@/generated/prisma/client";

const VALID_TYPES = new Set(["TRIAL_PRO", "TRIAL_PRO_PLUS", "BADGE", "CUSTOM"]);

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!(await checkIsAdmin())) return unauthorized();

  const { id: idParam } = await context.params;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const parsed = await parseJsonBody<Record<string, unknown>>(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  const data: Prisma.HoneyShopItemUpdateInput = {};

  if ("name" in body && typeof body.name === "string") data.name = body.name;
  if ("nameEn" in body) data.nameEn = body.nameEn as string | null;
  if ("nameTh" in body) data.nameTh = body.nameTh as string | null;
  if ("description" in body) data.description = body.description as string | null;
  if ("cost" in body) {
    const cost = Number(body.cost);
    if (!Number.isInteger(cost) || cost < 1) {
      return NextResponse.json({ error: "cost must be a positive integer" }, { status: 400 });
    }
    data.cost = cost;
  }
  if ("type" in body) {
    if (!VALID_TYPES.has(body.type as string)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
    data.type = body.type as ShopItemType;
  }
  if ("value" in body) data.value = body.value as Prisma.InputJsonValue ?? undefined;
  if ("isActive" in body) data.isActive = Boolean(body.isActive);
  if ("stock" in body) data.stock = body.stock === null ? null : Number(body.stock);

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const item = await prisma.honeyShopItem.update({
    where: { id },
    data,
  });

  return NextResponse.json({ item });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  if (!(await checkIsAdmin())) return unauthorized();

  const { id: idParam } = await context.params;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const item = await prisma.honeyShopItem.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ item });
}

import { NextRequest, NextResponse } from "next/server";
import { checkIsAdmin } from "@/lib/auth/check-admin";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const sp = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") || "50")));
  const skip = (page - 1) * limit;
  const search = sp.get("q") || "";
  const setFilter = sp.get("set") || "";
  const productFilter = sp.get("product") || "";
  const rarityFilter = sp.get("rarity") || "";
  const typeFilter = sp.get("type") || "";
  const colorFilter = sp.get("color") || "";
  const missingFilter = sp.get("missing") || "";

  const where: Prisma.CardWhereInput = {};

  if (productFilter) {
    where.productCards = { some: { product: { code: productFilter } } };
  } else if (setFilter) {
    where.set = { code: setFilter };
  }
  if (rarityFilter) {
    where.rarity = rarityFilter;
  }
  if (typeFilter) {
    where.cardType = typeFilter as Prisma.EnumCardTypeFilter["equals"];
  }
  if (colorFilter) {
    where.colorEn = { contains: colorFilter, mode: "insensitive" };
  }
  if (search) {
    where.OR = [
      { cardCode: { contains: search, mode: "insensitive" } },
      { baseCode: { contains: search, mode: "insensitive" } },
      { nameJp: { contains: search, mode: "insensitive" } },
      { nameEn: { contains: search, mode: "insensitive" } },
    ];
  }
  if (missingFilter === "en") {
    where.nameEn = null;
  } else if (missingFilter === "th") {
    where.nameTh = null;
  } else if (missingFilter === "image") {
    where.OR = [{ imageUrl: null }, { imageUrl: "" }];
  } else if (missingFilter === "price") {
    where.latestPriceJpy = null;
  } else if (missingFilter === "yuyutei") {
    where.yuyuteiId = null;
  }

  const [cards, total] = await Promise.all([
    prisma.card.findMany({
      where,
      orderBy: [{ baseCode: "asc" }, { isParallel: "asc" }],
      skip,
      take: limit,
      select: {
        id: true,
        cardCode: true,
        baseCode: true,
        nameJp: true,
        nameEn: true,
        nameTh: true,
        rarity: true,
        cardType: true,
        color: true,
        colorEn: true,
        imageUrl: true,
        isParallel: true,
        parallelIndex: true,
        latestPriceJpy: true,
        set: { select: { code: true, name: true } },
      },
    }),
    prisma.card.count({ where }),
  ]);

  return NextResponse.json({
    cards,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export async function PATCH(request: NextRequest) {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const allowedFields = [
    "nameEn",
    "nameTh",
    "imageUrl",
    "rarity",
    "cardType",
    "color",
    "colorEn",
  ];
  const data: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in updates) {
      data[key] = updates[key];
    }
  }

  const updated = await prisma.card.update({
    where: { id },
    data,
  });

  return NextResponse.json(updated);
}

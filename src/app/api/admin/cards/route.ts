import { NextRequest, NextResponse } from "next/server";
import { unauthorized, parseJsonBody } from "@/lib/api/admin-helpers";
import { parsePageLimit } from "@/lib/api/request-body";
import { checkIsAdmin } from "@/lib/auth/check-admin";
import { prisma } from "@/lib/db";
import { createLog } from "@/lib/logger";
import { Prisma } from "@/generated/prisma/client";

const log = createLog("admin:cards");

export async function GET(request: NextRequest) {
  if (!(await checkIsAdmin())) return unauthorized();

  const sp = request.nextUrl.searchParams;
  const { page, limit, skip } = parsePageLimit(sp, { defaultLimit: 50, maxLimit: 100 });
  const search = sp.get("q") || "";
  const setFilter = sp.get("set") || "";
  const rarityFilter = sp.get("rarity") || "";
  const missingFilter = sp.get("missing") || "";
  const parallelFilter = sp.get("parallel") || "";

  const where: Prisma.CardWhereInput = {};
  const andConditions: Prisma.CardWhereInput[] = [];

  if (setFilter) {
    where.set = { code: setFilter };
  }
  if (rarityFilter) {
    where.rarity = rarityFilter;
  }
  if (parallelFilter === "true") {
    where.isParallel = true;
  } else if (parallelFilter === "false") {
    where.isParallel = false;
  }
  if (search) {
    andConditions.push({
      OR: [
        { cardCode: { contains: search, mode: "insensitive" } },
        { baseCode: { contains: search, mode: "insensitive" } },
        { nameJp: { contains: search, mode: "insensitive" } },
        { nameEn: { contains: search, mode: "insensitive" } },
        { nameTh: { contains: search, mode: "insensitive" } },
      ],
    });
  }
  if (missingFilter === "en") {
    andConditions.push({ nameEn: null });
  } else if (missingFilter === "th") {
    andConditions.push({ nameTh: null });
  } else if (missingFilter === "image") {
    andConditions.push({ OR: [{ imageUrl: null }, { imageUrl: "" }] });
  } else if (missingFilter === "price") {
    andConditions.push({ latestPriceJpy: null });
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
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
        yuyuteiId: true,
        yuyuteiUrl: true,
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
  if (!(await checkIsAdmin())) return unauthorized();

  const parsed = await parseJsonBody<{ id: number; [key: string]: unknown }>(request);
  if (!parsed.ok) return parsed.response;

  try {
    const { id, ...updates } = parsed.body;

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
  } catch (error) {
    log.error("PATCH /api/admin/cards", error);
    return NextResponse.json({ error: "Failed to update card" }, { status: 500 });
  }
}

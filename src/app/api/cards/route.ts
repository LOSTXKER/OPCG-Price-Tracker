import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const set = searchParams.get("set") || "";
  const rarity = searchParams.get("rarity") || "";
  const type = searchParams.get("type") || "";
  const color = searchParams.get("color") || "";
  const minPrice = parseInt(searchParams.get("minPrice") || "0");
  const maxPrice = parseInt(searchParams.get("maxPrice") || "0");
  const sort = searchParams.get("sort") || "newest";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { nameJp: { contains: search, mode: "insensitive" } },
      { nameEn: { contains: search, mode: "insensitive" } },
      { cardCode: { contains: search, mode: "insensitive" } },
    ];
  }
  if (set) {
    where.set = { code: set };
  }
  if (rarity) {
    where.rarity = { in: rarity.split(",") };
  }
  if (type) {
    where.cardType = type;
  }
  if (color) {
    if (color === "multi") {
      where.colorEn = { contains: "/" };
    } else {
      where.colorEn = color;
    }
  }
  const variant = searchParams.get("variant") || "";
  if (minPrice > 0) {
    where.latestPriceJpy = { ...((where.latestPriceJpy as object) || {}), gte: minPrice };
  }
  if (maxPrice > 0) {
    where.latestPriceJpy = { ...((where.latestPriceJpy as object) || {}), lte: maxPrice };
  }
  if (variant === "parallel") {
    where.isParallel = true;
  } else if (variant === "regular") {
    where.isParallel = false;
  }

  let orderBy: Record<string, unknown> = {};
  switch (sort) {
    case "price_asc":
      orderBy.latestPriceJpy = { sort: "asc", nulls: "last" };
      break;
    case "price_desc":
      orderBy.latestPriceJpy = { sort: "desc", nulls: "last" };
      break;
    case "change_desc":
      orderBy.priceChange24h = { sort: "desc", nulls: "last" };
      break;
    case "change_asc":
      orderBy.priceChange24h = { sort: "asc", nulls: "last" };
      break;
    case "change_7d_desc":
      orderBy.priceChange7d = { sort: "desc", nulls: "last" };
      break;
    case "change_7d_asc":
      orderBy.priceChange7d = { sort: "asc", nulls: "last" };
      break;
    case "views_desc":
      orderBy.viewCount = { sort: "desc", nulls: "last" };
      break;
    case "name":
      orderBy.nameJp = "asc";
      break;
    default:
      orderBy.updatedAt = "desc";
  }

  try {
    const [cards, total] = await Promise.all([
      prisma.card.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          set: { select: { code: true, name: true, nameEn: true } },
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
  } catch (error) {
    console.error("Error fetching cards:", error);
    return NextResponse.json({ error: "Failed to fetch cards" }, { status: 500 });
  }
}

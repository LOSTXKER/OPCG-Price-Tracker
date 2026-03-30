import { parsePageLimit } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import { PRICE_SOURCE } from "@/lib/constants/prices";
import { createLog } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";

const log = createLog("api:cards");

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const set = searchParams.get("set") || "";
  const rarity = searchParams.get("rarity") || "";
  const type = searchParams.get("type") || "";
  const color = searchParams.get("color") || "";
  const minPrice = parseInt(searchParams.get("minPrice") || "0", 10) || 0;
  const maxPrice = parseInt(searchParams.get("maxPrice") || "0", 10) || 0;
  const sort = searchParams.get("sort") || "newest";
  const { page, limit, skip } = parsePageLimit(searchParams);

  const codes = searchParams.get("codes") || "";
  const game = searchParams.get("game") || "";
  const where: Record<string, unknown> = {};

  if (codes) {
    where.cardCode = { in: codes.split(",").filter(Boolean) };
  }
  if (game || set) {
    const setFilter: Record<string, unknown> = {};
    if (game) setFilter.game = { slug: game };
    if (set) setFilter.code = set;
    where.set = setFilter;
  }
  if (search) {
    where.OR = [
      { nameJp: { contains: search, mode: "insensitive" } },
      { nameEn: { contains: search, mode: "insensitive" } },
      { nameTh: { contains: search, mode: "insensitive" } },
      { cardCode: { contains: search, mode: "insensitive" } },
    ];
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

  const priceMode = searchParams.get("priceMode") || "";
  if (priceMode === "psa10") {
    where.prices = {
      some: {
        source: PRICE_SOURCE.SNKRDUNK,
        gradeCondition: PRICE_SOURCE.PSA_10,
        type: "SELL",
      },
    };
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
    case "change_30d_desc":
      orderBy.priceChange30d = { sort: "desc", nulls: "last" };
      break;
    case "change_30d_asc":
      orderBy.priceChange30d = { sort: "asc", nulls: "last" };
      break;
    case "views_desc":
      orderBy.viewCount = "desc";
      break;
    case "name":
      orderBy.nameJp = "asc";
      break;
    default:
      orderBy.updatedAt = "desc";
  }

  try {
    const [rawCards, total] = await Promise.all([
      prisma.card.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          set: { select: { code: true, name: true, nameEn: true, nameTh: true } },
          prices: {
            where: {
              source: PRICE_SOURCE.SNKRDUNK,
              gradeCondition: PRICE_SOURCE.PSA_10,
              type: "SELL",
            },
            orderBy: { scrapedAt: "desc" },
            take: 1,
            select: { priceUsd: true },
          },
        },
      }),
      prisma.card.count({ where }),
    ]);

    const cards = rawCards.map(({ prices, ...rest }) => ({
      ...rest,
      psa10PriceUsd: prices?.[0]?.priceUsd ?? null,
    }));

    return NextResponse.json({
      cards,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    log.error("Error fetching cards", error);
    return NextResponse.json({ error: "Failed to fetch cards" }, { status: 500 });
  }
}

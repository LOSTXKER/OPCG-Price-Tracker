import { apiHandler } from "@/lib/api/api-handler";
import { parsePageLimit } from "@/lib/api/request-body";
import { CardType, type Prisma } from "@/generated/prisma/client";
import { buildCardSearchFacets } from "@/lib/cards/search-filters";
import { prisma } from "@/lib/db";
import { PRICE_SOURCE } from "@/lib/constants/prices";
import { buildCardSetScope } from "@/lib/game/card-scope";
import {
  GRADE_TIER_BY_KEY,
  isRawGrade,
  type GradeKey,
} from "@/lib/pricing/grade-tiers";
import { NextRequest, NextResponse } from "next/server";

function splitCsv(value: string): string[] {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export const GET = apiHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const set = searchParams.get("set") || "";
  const rarity = searchParams.get("rarity") || "";
  const type = searchParams.get("type") || "";
  const color = searchParams.get("color") || "";
  const minPrice = parseInt(searchParams.get("minPrice") || "0", 10) || 0;
  const maxPrice = parseInt(searchParams.get("maxPrice") || "0", 10) || 0;
  const requestedSort = searchParams.get("sort") || "newest";
  const { page, limit, skip } = parsePageLimit(searchParams);

  const codes = searchParams.get("codes") || "";
  const game = searchParams.get("game") || "";
  const includeFacets = searchParams.get("includeFacets") === "true";
  const baseWhere: Prisma.CardWhereInput = {};

  if (codes) {
    baseWhere.cardCode = { in: splitCsv(codes) };
  }
  if (game) {
    baseWhere.set = buildCardSetScope(game);
  }
  if (search) {
    baseWhere.OR = [
      { nameJp: { contains: search, mode: "insensitive" } },
      { nameEn: { contains: search, mode: "insensitive" } },
      { nameTh: { contains: search, mode: "insensitive" } },
      { cardCode: { contains: search, mode: "insensitive" } },
    ];
  }

  // Facet availability stays anchored to search + game so multi-select options
  // do not disappear while the user toggles filters. Results add set/facets below.
  const where: Prisma.CardWhereInput = { ...baseWhere };
  if (set) where.set = buildCardSetScope(game || undefined, set);

  if (rarity) {
    // A base rarity also matches its parallel (SEC → SEC + P-SEC) so the filter
    // shows the whole family; the `variant` param below narrows regular/parallel.
    const rarityCodes = splitCsv(rarity)
      .flatMap((r) => (r.startsWith("P-") ? [r] : [r, `P-${r}`]));
    where.rarity = { in: [...new Set(rarityCodes)] };
  }
  if (type) {
    const requestedTypes = splitCsv(type);
    const validTypes = requestedTypes.filter((value): value is CardType =>
      Object.values(CardType).includes(value as CardType),
    );
    if (validTypes.length !== requestedTypes.length) {
      return NextResponse.json({ error: "Invalid card type" }, { status: 400 });
    }
    if (validTypes.length > 0) where.cardType = { in: validTypes };
  }
  if (color) {
    const colors = splitCsv(color);
    const singleColors = colors.filter((value) => value !== "multi");
    const colorFilters: Prisma.CardWhereInput[] = [];
    if (singleColors.length > 0) colorFilters.push({ colorEn: { in: singleColors } });
    if (colors.includes("multi")) colorFilters.push({ colorEn: { contains: "/" } });
    if (colorFilters.length > 0) where.AND = [{ OR: colorFilters }];
  }
  const variant = searchParams.get("variant") || "";
  const gradeParam = searchParams.get("grade");
  if (gradeParam && !Object.hasOwn(GRADE_TIER_BY_KEY, gradeParam)) {
    return NextResponse.json({ error: "Invalid grade" }, { status: 400 });
  }
  // Temporary compatibility for callers from the former Raw/PSA 10 lens.
  // New surfaces send the canonical grade key (`psa_10`).
  const legacyPriceMode = searchParams.get("priceMode");
  const grade: GradeKey = gradeParam
    ? (gradeParam as GradeKey)
    : legacyPriceMode === "psa10"
      ? "psa_10"
      : "raw";
  const rawGrade = isRawGrade(grade);

  // Price-range inputs are currently backed by Card.latestPriceJpy (Raw) only.
  // Never apply a hidden Raw constraint while the user is viewing a graded lens.
  if (rawGrade && (minPrice > 0 || maxPrice > 0)) {
    where.latestPriceJpy = {
      ...(minPrice > 0 ? { gte: minPrice } : {}),
      ...(maxPrice > 0 ? { lte: maxPrice } : {}),
    };
  }
  if (variant === "parallel") {
    where.isParallel = true;
  } else if (variant === "regular") {
    where.isParallel = false;
  }

  if (!rawGrade) {
    where.prices = {
      some: {
        source: PRICE_SOURCE.SNKRDUNK,
        gradeCondition: PRICE_SOURCE.PSA_10,
        type: "SELL",
      },
    };
  }

  // Prisma cannot order Card rows by the latest value in a to-many price
  // relation. Until graded snapshots have a flattened sort field, fall back to
  // newest instead of silently sorting a graded table by Raw price/change.
  const sort =
    !rawGrade && /^(price_|change_)/.test(requestedSort)
      ? "newest"
      : requestedSort;

  const orderBy: Record<string, unknown> = {};
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
    case "rarity_asc":
      orderBy.rarity = "asc";
      break;
    case "rarity_desc":
      orderBy.rarity = "desc";
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

  const facetsPromise = includeFacets
    ? prisma.card.groupBy({
        by: ["setId", "rarity", "cardType", "colorEn", "isParallel"],
        where: baseWhere,
        _count: true,
      }).then(buildCardSearchFacets)
    : Promise.resolve(undefined);

  const [rawCards, total, valueAgg, facets] = await Promise.all([
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
    prisma.card.aggregate({ _sum: { latestPriceJpy: true }, where: { latestPriceJpy: { gt: 0 } } }),
    facetsPromise,
  ]);

  const cards = rawCards.map(({ prices, ...rest }) => ({
    ...rest,
    psa10PriceUsd: prices?.[0]?.priceUsd ?? null,
  }));

  return NextResponse.json({
    cards,
    total,
    totalValue: valueAgg._sum.latestPriceJpy ?? 0,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    ...(facets ? { facets } : {}),
  });
});

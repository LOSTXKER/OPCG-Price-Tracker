import {
  CardCondition,
  ListingStatus,
  type Prisma,
} from "@/generated/prisma/client";
import { parseCondition } from "@/lib/api/parse-condition";
import { parsePageLimit } from "@/lib/api/request-body";
import { cardInclude, userPublicSelect } from "@/lib/api/query-fragments";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import type { CreateListingInput } from "./schemas";

export type ListingSearchResult =
  | {
      ok: true;
      listings: Awaited<ReturnType<typeof prisma.listing.findMany>>;
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }
  | { ok: false; response: NextResponse };

/**
 * Resolve a `?seller=` query value to a concrete user id. Accepts either the
 * raw cuid or an `@handle`. Returns `null` when the value points at no user
 * (callers should short-circuit to an empty result).
 */
async function resolveSellerId(rawSeller: string): Promise<string | null> {
  const trimmed = rawSeller.trim().replace(/^@/, "").slice(0, 60);
  if (!trimmed) return null;
  const seller = await prisma.user.findFirst({
    where: { OR: [{ handle: trimmed }, { id: trimmed }] },
    select: { id: true },
  });
  return seller?.id ?? null;
}

/**
 * Build the Prisma WHERE / ORDER BY for the marketplace listings GET. Returns
 * either the validated search payload or a 4xx NextResponse so the route stays
 * a thin shell.
 */
export async function searchActiveListings(searchParams: URLSearchParams): Promise<ListingSearchResult> {
  const cardIdParam = searchParams.get("cardId");
  const conditionParam = searchParams.get("condition");
  const sort = searchParams.get("sort") || "newest";
  const { page, limit, skip } = parsePageLimit(searchParams);
  const minPriceJpy = searchParams.get("minPriceJpy");
  const maxPriceJpy = searchParams.get("maxPriceJpy");
  const gameSlug = searchParams.get("game") || "";
  const rarityParam = searchParams.get("rarity");
  const searchQuery = searchParams.get("q");
  const sellerParam = searchParams.get("seller");

  const where: Prisma.ListingWhereInput = { status: ListingStatus.ACTIVE };

  if (sellerParam) {
    const sellerId = await resolveSellerId(sellerParam);
    if (sellerId === null) {
      return {
        ok: true,
        listings: [],
        total: 0,
        page: 1,
        limit,
        totalPages: 0,
      };
    }
    where.userId = sellerId;
  }

  const cardFilter: Prisma.CardWhereInput = {};
  if (gameSlug) {
    cardFilter.set = { game: { slug: gameSlug } };
  }
  if (rarityParam) {
    const rarities = rarityParam.split(",").map((r) => r.trim()).filter(Boolean);
    if (rarities.length === 1) {
      cardFilter.rarity = rarities[0];
    } else if (rarities.length > 1) {
      cardFilter.rarity = { in: rarities };
    }
  }
  if (searchQuery) {
    const q = searchQuery.trim();
    cardFilter.OR = [
      { cardCode: { contains: q, mode: "insensitive" } },
      { nameJp: { contains: q, mode: "insensitive" } },
      { nameEn: { contains: q, mode: "insensitive" } },
    ];
  }
  if (Object.keys(cardFilter).length > 0) {
    where.card = cardFilter;
  }

  const priceJpyFilter: Prisma.IntFilter = {};
  if (minPriceJpy) {
    const v = Number(minPriceJpy);
    if (Number.isInteger(v) && v >= 0) priceJpyFilter.gte = v;
  }
  if (maxPriceJpy) {
    const v = Number(maxPriceJpy);
    if (Number.isInteger(v) && v >= 0) priceJpyFilter.lte = v;
  }
  if (Object.keys(priceJpyFilter).length > 0) {
    where.priceJpy = priceJpyFilter;
  }

  if (cardIdParam) {
    const cardId = Number(cardIdParam);
    if (!Number.isInteger(cardId) || cardId < 1) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Invalid cardId" }, { status: 400 }),
      };
    }
    where.cardId = cardId;
  }

  if (conditionParam) {
    const c = parseCondition(conditionParam);
    if (!c) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Invalid condition" }, { status: 400 }),
      };
    }
    where.condition = c;
  }

  const orderBy: Record<string, "asc" | "desc"> = {};
  switch (sort) {
    case "price_jpy_asc":
      orderBy.priceJpy = "asc";
      break;
    case "price_jpy_desc":
      orderBy.priceJpy = "desc";
      break;
    case "price_thb_asc":
      orderBy.priceThb = "asc";
      break;
    case "price_thb_desc":
      orderBy.priceThb = "desc";
      break;
    case "newest":
    default:
      orderBy.createdAt = "desc";
  }

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        card: { include: cardInclude },
        user: { select: userPublicSelect },
      },
    }),
    prisma.listing.count({ where }),
  ]);

  return {
    ok: true,
    listings,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export type CreateListingResult =
  | { ok: true; listing: Awaited<ReturnType<typeof prisma.listing.create>> }
  | { ok: false; response: NextResponse };

/**
 * Validate-and-create a marketplace listing for `userId`. Returns either the
 * created listing or a 4xx NextResponse describing the validation error.
 *
 * The body is expected to already be parsed through `CreateListingSchema`.
 */
export async function createListing(
  userId: string,
  body: CreateListingInput,
): Promise<CreateListingResult> {
  const card = await prisma.card.findUnique({ where: { id: body.cardId } });
  if (!card) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Card not found" }, { status: 404 }),
    };
  }

  // Treat 0 as "not set" — it's never a meaningful listing price and would
  // otherwise display as "0 ฿" everywhere.
  const priceThb =
    typeof body.priceThb === "number" && body.priceThb > 0 ? body.priceThb : null;

  const listing = await prisma.listing.create({
    data: {
      userId,
      cardId: body.cardId,
      priceJpy: body.priceJpy,
      priceThb,
      condition: body.condition ?? CardCondition.NM,
      quantity: body.quantity ?? 1,
      description:
        typeof body.description === "string" ? body.description.slice(0, 5000) : null,
      photos: (body.photos ?? []).slice(0, 20).map((u) => u.slice(0, 2000)),
      shipping: (body.shipping ?? []).slice(0, 20).map((s) => s.slice(0, 500)),
      location:
        typeof body.location === "string" ? body.location.slice(0, 200) : null,
      status: ListingStatus.ACTIVE,
    },
    include: {
      card: { include: cardInclude },
      user: { select: userPublicSelect },
    },
  });

  return { ok: true, listing };
}

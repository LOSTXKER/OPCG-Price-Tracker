import {
  CardCondition,
  ListingStatus,
  type Prisma,
} from "@/generated/prisma/client";
import { requireAuthUser } from "@/lib/api/auth";
import { parseCondition } from "@/lib/api/parse-condition";
import { parseListingQuantity, parseJsonBody, parsePageLimit } from "@/lib/api/request-body";
import { cardInclude, userPublicSelect, asStringArray } from "@/lib/api/query-fragments";
import { prisma } from "@/lib/db";
import { createLog } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";

const log = createLog("api:listings");

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cardIdParam = searchParams.get("cardId");
    const conditionParam = searchParams.get("condition");
    const sort = searchParams.get("sort") || "newest";
    const { page, limit, skip } = parsePageLimit(searchParams);
    const minPriceJpy = searchParams.get("minPriceJpy");
    const maxPriceJpy = searchParams.get("maxPriceJpy");

    const gameSlug = searchParams.get("game") || "";
    const rarityParam = searchParams.get("rarity");
    const searchQuery = searchParams.get("q");
    // Item C — accept a `seller` filter so we can deep-link from a public
    // profile to "all listings by this seller". The value can be either the
    // user's id (cuid) or their custom @handle; we resolve handles to ids
    // before filtering so the WHERE clause is always indexed on userId.
    const sellerParam = searchParams.get("seller");
    const where: Prisma.ListingWhereInput = {
      status: ListingStatus.ACTIVE,
    };

    if (sellerParam) {
      const trimmed = sellerParam.trim().replace(/^@/, "").slice(0, 60);
      if (trimmed) {
        // Try to resolve as a handle first; fall back to treating the value
        // as a raw user id. If neither matches we short-circuit with an
        // empty result instead of returning the entire marketplace.
        const seller = await prisma.user.findFirst({
          where: { OR: [{ handle: trimmed }, { id: trimmed }] },
          select: { id: true },
        });
        if (!seller) {
          return NextResponse.json({
            listings: [],
            total: 0,
            page: 1,
            limit: parsePageLimit(searchParams).limit,
            totalPages: 0,
          });
        }
        where.userId = seller.id;
      }
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
        return NextResponse.json({ error: "Invalid cardId" }, { status: 400 });
      }
      where.cardId = cardId;
    }

    if (conditionParam) {
      const c = parseCondition(conditionParam);
      if (!c) {
        return NextResponse.json({ error: "Invalid condition" }, { status: 400 });
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

    return NextResponse.json({
      listings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    log.error("GET /api/listings", error);
    return NextResponse.json({ error: "Failed to load listings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthUser();
    if (!auth.ok) return auth.response;
    const dbUser = auth.user;

    const parsed = await parseJsonBody<Record<string, unknown>>(request);
    if (!parsed.ok) return parsed.response;
    const body = parsed.body;

    const cardId = typeof body.cardId === "number" ? body.cardId : Number(body.cardId);
    const priceJpy = typeof body.priceJpy === "number" ? body.priceJpy : Number(body.priceJpy);
    let priceThb: number | null = null;
    if (body.priceThb !== null && body.priceThb !== undefined) {
      const raw = typeof body.priceThb === "number" ? body.priceThb : Number(body.priceThb);
      if (!Number.isFinite(raw) || raw < 0) {
        return NextResponse.json({ error: "Invalid priceThb" }, { status: 400 });
      }
      // Treat 0 as "not set" — it's never a meaningful listing price and would
      // otherwise display as "0 ฿" everywhere.
      priceThb = raw > 0 ? raw : null;
    }
    const condition = parseCondition(body.condition) ?? CardCondition.NM;
    const quantityRaw =
      typeof body.quantity === "number" ? body.quantity : Number(body.quantity ?? 1);
    const description =
      typeof body.description === "string"
        ? body.description.slice(0, 5000)
        : body.description === null || body.description === undefined
          ? null
          : null;
    const location =
      typeof body.location === "string"
        ? body.location.slice(0, 200)
        : body.location === null || body.location === undefined
          ? null
          : null;

    const photos = asStringArray(body.photos, "photos");
    if (photos instanceof NextResponse) return photos;
    const shipping = asStringArray(body.shipping, "shipping");
    if (shipping instanceof NextResponse) return shipping;

    if (!Number.isInteger(cardId) || cardId < 1) {
      return NextResponse.json({ error: "Invalid cardId" }, { status: 400 });
    }
    if (!Number.isInteger(priceJpy) || priceJpy < 1) {
      return NextResponse.json({ error: "priceJpy must be a positive integer" }, { status: 400 });
    }
    if (body.condition !== undefined && parseCondition(body.condition) === null) {
      return NextResponse.json({ error: "Invalid condition" }, { status: 400 });
    }
    const parsedQty = parseListingQuantity(quantityRaw);
    if (!parsedQty.ok) return parsedQty.response;
    const quantity = parsedQty.value;
    if (body.description !== undefined && typeof body.description !== "string" && body.description !== null) {
      return NextResponse.json({ error: "description must be a string or null" }, { status: 400 });
    }
    if (body.location !== undefined && typeof body.location !== "string" && body.location !== null) {
      return NextResponse.json({ error: "location must be a string or null" }, { status: 400 });
    }

    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const listing = await prisma.listing.create({
      data: {
        userId: dbUser.id,
        cardId,
        priceJpy,
        priceThb,
        condition,
        quantity,
        description,
        photos: photos.slice(0, 20).map((u) => u.slice(0, 2000)),
        shipping: shipping.slice(0, 20).map((s) => s.slice(0, 500)),
        location,
        status: ListingStatus.ACTIVE,
      },
      include: {
        card: { include: cardInclude },
        user: { select: userPublicSelect },
      },
    });

    return NextResponse.json({ listing }, { status: 201 });
  } catch (error) {
    log.error("POST /api/listings", error);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}

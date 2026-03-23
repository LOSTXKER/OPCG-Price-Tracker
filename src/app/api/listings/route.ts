import {
  CardCondition,
  ListingStatus,
  type CardCondition as CardConditionType,
  type Prisma,
} from "@/generated/prisma/client";
import { syncAppUser } from "@/lib/auth/sync-app-user";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const CONDITIONS = new Set<string>(Object.values(CardCondition));

const cardInclude = {
  set: { select: { code: true, name: true, nameEn: true } },
} as const;

const userPublicSelect = {
  id: true,
  displayName: true,
  avatarUrl: true,
  sellerRating: true,
  sellerReviewCount: true,
} as const;

function parseCondition(value: unknown): CardConditionType | null {
  if (typeof value !== "string" || !CONDITIONS.has(value)) return null;
  return value as CardConditionType;
}

function asStringArray(value: unknown, field: string): string[] | NextResponse {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    return NextResponse.json({ error: `${field} must be an array of strings` }, { status: 400 });
  }
  for (const v of value) {
    if (typeof v !== "string") {
      return NextResponse.json({ error: `${field} must contain only strings` }, { status: 400 });
    }
  }
  return value as string[];
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cardIdParam = searchParams.get("cardId");
    const conditionParam = searchParams.get("condition");
    const sort = searchParams.get("sort") || "newest";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20), 100);
    const skip = (page - 1) * limit;
    const minPriceJpy = searchParams.get("minPriceJpy");
    const maxPriceJpy = searchParams.get("maxPriceJpy");

    const where: Prisma.ListingWhereInput = {
      status: ListingStatus.ACTIVE,
    };

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
    console.error("GET /api/listings:", error);
    return NextResponse.json({ error: "Failed to load listings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await syncAppUser(user);

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const cardId = typeof body.cardId === "number" ? body.cardId : Number(body.cardId);
    const priceJpy = typeof body.priceJpy === "number" ? body.priceJpy : Number(body.priceJpy);
    let priceThb: number | null = null;
    if (body.priceThb !== null && body.priceThb !== undefined) {
      const raw = typeof body.priceThb === "number" ? body.priceThb : Number(body.priceThb);
      if (!Number.isFinite(raw) || raw < 0) {
        return NextResponse.json({ error: "Invalid priceThb" }, { status: 400 });
      }
      priceThb = raw;
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
    if (!Number.isInteger(quantityRaw) || quantityRaw < 1 || quantityRaw > 9999) {
      return NextResponse.json({ error: "quantity must be an integer from 1 to 9999" }, { status: 400 });
    }
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
        quantity: quantityRaw,
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
    console.error("POST /api/listings:", error);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}

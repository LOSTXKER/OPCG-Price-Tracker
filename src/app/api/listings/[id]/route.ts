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
const STATUSES = new Set<string>(Object.values(ListingStatus));

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

function parseStatus(value: unknown): (typeof ListingStatus)[keyof typeof ListingStatus] | null {
  if (typeof value !== "string" || !STATUSES.has(value)) return null;
  return value as (typeof ListingStatus)[keyof typeof ListingStatus];
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

type RouteContext = { params: Promise<{ id: string }> };

async function getOwnedListing(listingId: number, userId: string) {
  return prisma.listing.findFirst({
    where: { id: listingId, userId },
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await syncAppUser(user);

    const { id: idParam } = await context.params;
    const listingId = Number(idParam);
    if (!Number.isInteger(listingId) || listingId < 1) {
      return NextResponse.json({ error: "Invalid listing id" }, { status: 400 });
    }

    const existing = await getOwnedListing(listingId, dbUser.id);
    if (!existing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const data: Prisma.ListingUpdateInput = {};

    if ("priceJpy" in body) {
      const v = typeof body.priceJpy === "number" ? body.priceJpy : Number(body.priceJpy);
      if (!Number.isInteger(v) || v < 1) {
        return NextResponse.json({ error: "Invalid priceJpy" }, { status: 400 });
      }
      data.priceJpy = v;
    }

    if ("priceThb" in body) {
      if (body.priceThb === null) {
        data.priceThb = null;
      } else {
        const v = typeof body.priceThb === "number" ? body.priceThb : Number(body.priceThb);
        if (!Number.isFinite(v) || v < 0) {
          return NextResponse.json({ error: "Invalid priceThb" }, { status: 400 });
        }
        data.priceThb = v;
      }
    }

    if ("condition" in body) {
      const c = parseCondition(body.condition);
      if (!c) {
        return NextResponse.json({ error: "Invalid condition" }, { status: 400 });
      }
      data.condition = c;
    }

    if ("quantity" in body) {
      const v = typeof body.quantity === "number" ? body.quantity : Number(body.quantity);
      if (!Number.isInteger(v) || v < 1 || v > 9999) {
        return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
      }
      data.quantity = v;
    }

    if ("description" in body) {
      if (body.description !== null && typeof body.description !== "string") {
        return NextResponse.json({ error: "description must be a string or null" }, { status: 400 });
      }
      data.description =
        body.description === null || body.description === undefined
          ? null
          : (body.description as string).slice(0, 5000);
    }

    if ("location" in body) {
      if (body.location !== null && typeof body.location !== "string") {
        return NextResponse.json({ error: "location must be a string or null" }, { status: 400 });
      }
      data.location =
        body.location === null || body.location === undefined
          ? null
          : (body.location as string).slice(0, 200);
    }

    if ("photos" in body) {
      const photos = asStringArray(body.photos, "photos");
      if (photos instanceof NextResponse) return photos;
      data.photos = photos.slice(0, 20).map((u) => u.slice(0, 2000));
    }

    if ("shipping" in body) {
      const shipping = asStringArray(body.shipping, "shipping");
      if (shipping instanceof NextResponse) return shipping;
      data.shipping = shipping.slice(0, 20).map((s) => s.slice(0, 500));
    }

    if ("status" in body) {
      const s = parseStatus(body.status);
      if (!s) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      data.status = s;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const listing = await prisma.listing.update({
      where: { id: listingId },
      data,
      include: {
        card: { include: cardInclude },
        user: { select: userPublicSelect },
      },
    });

    return NextResponse.json({ listing });
  } catch (error) {
    console.error("PATCH /api/listings/[id]:", error);
    return NextResponse.json({ error: "Failed to update listing" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await syncAppUser(user);

    const { id: idParam } = await context.params;
    const listingId = Number(idParam);
    if (!Number.isInteger(listingId) || listingId < 1) {
      return NextResponse.json({ error: "Invalid listing id" }, { status: 400 });
    }

    const existing = await getOwnedListing(listingId, dbUser.id);
    if (!existing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const listing = await prisma.listing.update({
      where: { id: listingId },
      data: { status: ListingStatus.CANCELLED },
      include: {
        card: { include: cardInclude },
        user: { select: userPublicSelect },
      },
    });

    return NextResponse.json({ listing });
  } catch (error) {
    console.error("DELETE /api/listings/[id]:", error);
    return NextResponse.json({ error: "Failed to cancel listing" }, { status: 500 });
  }
}

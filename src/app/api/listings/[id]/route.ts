import {
  ListingStatus,
  type Prisma,
} from "@/generated/prisma/client";
import { requireAuthUser } from "@/lib/api/auth";
import { parseCondition } from "@/lib/api/parse-condition";
import { parseListingQuantity, parseJsonBody } from "@/lib/api/request-body";
import { cardInclude, userPublicSelect, asStringArray } from "@/lib/api/query-fragments";
import { prisma } from "@/lib/db";
import { createLog } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";

const log = createLog("api:listings");

const STATUSES = new Set<string>(Object.values(ListingStatus));

function parseStatus(value: unknown): (typeof ListingStatus)[keyof typeof ListingStatus] | null {
  if (typeof value !== "string" || !STATUSES.has(value)) return null;
  return value as (typeof ListingStatus)[keyof typeof ListingStatus];
}

type RouteContext = { params: Promise<{ id: string }> };

async function getOwnedListing(listingId: number, userId: string) {
  return prisma.listing.findFirst({
    where: { id: listingId, userId },
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuthUser();
    if (!auth.ok) return auth.response;
    const dbUser = auth.user;

    const { id: idParam } = await context.params;
    const listingId = Number(idParam);
    if (!Number.isInteger(listingId) || listingId < 1) {
      return NextResponse.json({ error: "Invalid listing id" }, { status: 400 });
    }

    const existing = await getOwnedListing(listingId, dbUser.id);
    if (!existing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const parsed = await parseJsonBody<Record<string, unknown>>(request);
    if (!parsed.ok) return parsed.response;
    const body = parsed.body;

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
      const parsedQty = parseListingQuantity(body.quantity);
      if (!parsedQty.ok) return parsedQty.response;
      data.quantity = parsedQty.value;
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
    log.error("PATCH /api/listings/[id]", error);
    return NextResponse.json({ error: "Failed to update listing" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuthUser();
    if (!auth.ok) return auth.response;
    const dbUser = auth.user;

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
    log.error("DELETE /api/listings/[id]", error);
    return NextResponse.json({ error: "Failed to cancel listing" }, { status: 500 });
  }
}

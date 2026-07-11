import {
  ListingStatus,
  type Prisma,
} from "@/generated/prisma/client";
import { apiHandler } from "@/lib/api/api-handler";
import { requireAuthUser } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/request-body";
import { cardInclude, userPublicSelect } from "@/lib/api/query-fragments";
import { prisma } from "@/lib/db";
import { earnHoney, getHoneyMultiplier } from "@/lib/honey";
import { createLog } from "@/lib/logger";
import { guardMarketplaceApi } from "@/lib/marketplace/feature-flag";
import { UpdateListingSchema } from "@/lib/marketplace/schemas";
import { NextRequest, NextResponse } from "next/server";

const log = createLog("api:listings");

type RouteContext = { params: Promise<{ id: string }> };

async function getOwnedListing(listingId: number, userId: string) {
  return prisma.listing.findFirst({
    where: { id: listingId, userId },
  });
}

export const PATCH = apiHandler(async (request: NextRequest, context: RouteContext) => {
  const blocked = await guardMarketplaceApi();
  if (blocked) return blocked;

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

  const parsed = await parseJsonBody(request, UpdateListingSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  const data: Prisma.ListingUpdateInput = {};

  if (body.priceJpy !== undefined) data.priceJpy = body.priceJpy;
  if (body.priceThb !== undefined) {
    // 0 means "no explicit THB price" — store as null so the UI falls back
    // to JPY-based conversion instead of rendering "0 ฿".
    data.priceThb =
      typeof body.priceThb === "number" && body.priceThb > 0 ? body.priceThb : null;
  }
  if (body.condition !== undefined) data.condition = body.condition;
  if (body.quantity !== undefined) data.quantity = body.quantity;
  if (body.description !== undefined) {
    data.description =
      typeof body.description === "string" ? body.description.slice(0, 5000) : null;
  }
  if (body.location !== undefined) {
    data.location =
      typeof body.location === "string" ? body.location.slice(0, 200) : null;
  }
  if (body.photos !== undefined) {
    data.photos = body.photos.slice(0, 20).map((u) => u.slice(0, 2000));
  }
  if (body.shipping !== undefined) {
    data.shipping = body.shipping.slice(0, 20).map((s) => s.slice(0, 500));
  }
  if (body.status !== undefined) data.status = body.status;

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

  if (data.status === "SOLD" && existing.status !== ListingStatus.SOLD) {
    try {
      await earnHoney(
        dbUser.id,
        "MARKETPLACE_SELL",
        "Sold item on marketplace",
        { listingId },
        getHoneyMultiplier(dbUser.tier, dbUser.tierExpiresAt),
        { idempotencyKey: `marketplace-sell:${listingId}` },
      );
    } catch (err) {
      log.error("earnHoney(MARKETPLACE_SELL)", err);
    }
  }

  return NextResponse.json({ listing });
});

export const DELETE = apiHandler(async (_request: NextRequest, context: RouteContext) => {
  const blocked = await guardMarketplaceApi();
  if (blocked) return blocked;

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
});

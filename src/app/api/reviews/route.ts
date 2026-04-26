import { apiHandler } from "@/lib/api/api-handler";
import { requireAuthUser } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import { earnHoney, getHoneyMultiplier } from "@/lib/honey";
import { createLog } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";

const log = createLog("api:reviews");

export const POST = apiHandler(async (request: NextRequest) => {
  try {
    const auth = await requireAuthUser();
    if (!auth.ok) return auth.response;
    const dbUser = auth.user;

    const parsed = await parseJsonBody<{
      revieweeId: string;
      listingId?: number | null;
      rating: number;
      comment?: string | null;
    }>(request);
    if (!parsed.ok) return parsed.response;
    const { revieweeId, listingId, rating, comment } = parsed.body;

    if (!revieweeId || typeof revieweeId !== "string") {
      return NextResponse.json({ error: "revieweeId is required" }, { status: 400 });
    }
    if (revieweeId === dbUser.id) {
      return NextResponse.json({ error: "Cannot review yourself" }, { status: 400 });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "rating must be 1-5" }, { status: 400 });
    }

    const reviewee = await prisma.user.findUnique({ where: { id: revieweeId } });
    if (!reviewee) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existing = await prisma.review.findUnique({
      where: {
        reviewerId_revieweeId_listingId: {
          reviewerId: dbUser.id,
          revieweeId,
          listingId: listingId ?? 0,
        },
      },
    });
    if (existing) {
      return NextResponse.json({ error: "Review already exists" }, { status: 409 });
    }

    const review = await prisma.review.create({
      data: {
        reviewerId: dbUser.id,
        revieweeId,
        listingId: listingId ?? null,
        rating,
        comment: comment ? comment.slice(0, 2000) : null,
      },
    });

    const agg = await prisma.review.aggregate({
      where: { revieweeId },
      _avg: { rating: true },
      _count: { id: true },
    });
    await prisma.user.update({
      where: { id: revieweeId },
      data: {
        sellerRating: agg._avg.rating ?? rating,
        sellerReviewCount: agg._count.id,
      },
    });

    earnHoney(
      dbUser.id,
      "REVIEW",
      "Wrote a review",
      { revieweeId, listingId: listingId ?? null },
      getHoneyMultiplier(dbUser.tier, dbUser.tierExpiresAt),
    ).catch(() => {});

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    log.error("POST /api/reviews", error);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
});

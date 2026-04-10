import { NextRequest, NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/api/auth";
import { parsePageLimit } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const userId = auth.user.id;

  const sp = request.nextUrl.searchParams;
  const { page, limit, skip } = parsePageLimit(sp);
  const ratingParam = sp.get("rating");

  const where: { revieweeId: string; rating?: number } = { revieweeId: userId };
  if (ratingParam) {
    const r = parseInt(ratingParam, 10);
    if (r >= 1 && r <= 5) where.rating = r;
  }

  const [reviews, total, aggregate, ratingCounts] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        reviewer: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    }),
    prisma.review.count({ where }),
    prisma.review.aggregate({
      where: { revieweeId: userId },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.review.groupBy({
      by: ["rating"],
      where: { revieweeId: userId },
      _count: true,
    }),
  ]);

  const counts: Record<number, number> = {};
  for (const row of ratingCounts) {
    counts[row.rating] = row._count;
  }

  return NextResponse.json({
    reviews,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    avgRating: aggregate._avg.rating,
    totalReviews: aggregate._count,
    ratingCounts: counts,
  });
}

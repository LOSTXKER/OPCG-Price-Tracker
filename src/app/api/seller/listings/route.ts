import { NextRequest, NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/api/auth";
import { apiHandler } from "@/lib/api/api-handler";
import { parsePageLimit } from "@/lib/api/request-body";
import { cardInclude } from "@/lib/api/query-fragments";
import { prisma } from "@/lib/db";
import { ListingStatus, type Prisma } from "@/generated/prisma/client";
import { guardMarketplaceApi } from "@/lib/marketplace/feature-flag";

export const GET = apiHandler(async (request: NextRequest) => {
  const blocked = await guardMarketplaceApi();
  if (blocked) return blocked;

  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const userId = auth.user.id;

  const searchParams = request.nextUrl.searchParams;
  const { page, limit, skip } = parsePageLimit(searchParams);
  const statusParam = searchParams.get("status");
  const searchQuery = searchParams.get("q");

  const where: Prisma.ListingWhereInput = { userId };

  if (statusParam && statusParam !== "ALL") {
    const validStatuses = Object.values(ListingStatus);
    if (validStatuses.includes(statusParam as ListingStatus)) {
      where.status = statusParam as ListingStatus;
    }
  }

  if (searchQuery) {
    const q = searchQuery.trim();
    where.card = {
      OR: [
        { cardCode: { contains: q, mode: "insensitive" } },
        { nameJp: { contains: q, mode: "insensitive" } },
        { nameEn: { contains: q, mode: "insensitive" } },
      ],
    };
  }

  const [listings, total, statusCounts] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        card: { include: cardInclude },
        _count: { select: { offers: true, savedBy: true } },
      },
    }),
    prisma.listing.count({ where }),
    prisma.listing.groupBy({
      by: ["status"],
      where: { userId },
      _count: true,
    }),
  ]);

  const counts: Record<string, number> = {};
  for (const row of statusCounts) {
    counts[row.status] = row._count;
  }

  return NextResponse.json({
    listings,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    statusCounts: counts,
  });
});

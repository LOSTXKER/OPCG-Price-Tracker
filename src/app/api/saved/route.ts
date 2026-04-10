import { NextRequest, NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/api/auth";
import { parsePageLimit } from "@/lib/api/request-body";
import { cardInclude, userPublicSelect } from "@/lib/api/query-fragments";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const userId = auth.user.id;

  const { page, limit, skip } = parsePageLimit(request.nextUrl.searchParams);

  const [saved, total] = await Promise.all([
    prisma.savedListing.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        listing: {
          include: {
            card: { include: cardInclude },
            user: { select: userPublicSelect },
          },
        },
      },
    }),
    prisma.savedListing.count({ where: { userId } }),
  ]);

  return NextResponse.json({
    saved,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

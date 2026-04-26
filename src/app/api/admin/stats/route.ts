import { NextRequest, NextResponse } from "next/server";
import { adminApiHandler } from "@/lib/api/api-handler";
import { prisma } from "@/lib/db";

export const GET = adminApiHandler(async (_req: NextRequest, _admin) => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalCards,
    totalSets,
    missingEn,
    missingTh,
    missingImage,
    totalWithPrice,
    parallelCards,
    parallelNoImage,
    totalUsers,
    activeUsers7d,
    newUsers30d,
    tierFree,
    tierPro,
    tierProPlus,
    activePriceAlerts,
    totalListings,
  ] = await Promise.all([
    prisma.card.count(),
    prisma.cardSet.count(),
    prisma.card.count({ where: { nameEn: null } }),
    prisma.card.count({ where: { nameTh: null } }),
    prisma.card.count({ where: { OR: [{ imageUrl: null }, { imageUrl: "" }] } }),
    prisma.card.count({ where: { latestPriceJpy: { not: null } } }),
    prisma.card.count({ where: { isParallel: true } }),
    prisma.card.count({
      where: {
        isParallel: true,
        OR: [
          { imageUrl: null },
          { imageUrl: "" },
          { imageUrl: { contains: "yuyu-tei" } },
        ],
      },
    }),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null, updatedAt: { gte: sevenDaysAgo } } }),
    prisma.user.count({ where: { deletedAt: null, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.user.count({ where: { deletedAt: null, tier: "FREE" } }),
    prisma.user.count({ where: { deletedAt: null, tier: { in: ["PRO", "LIFETIME_PRO"] } } }),
    prisma.user.count({ where: { deletedAt: null, tier: { in: ["PRO_PLUS", "LIFETIME_PRO_PLUS"] } } }),
    prisma.priceAlert.count({ where: { isActive: true } }),
    prisma.listing.count({ where: { status: "ACTIVE" } }),
  ]);

  return NextResponse.json({
    totalCards,
    totalSets,
    missingEn,
    missingTh,
    missingImage,
    totalWithPrice,
    parallelCards,
    parallelNoImage,
    enCoverage: totalCards > 0 ? ((totalCards - missingEn) / totalCards) * 100 : 0,
    thCoverage: totalCards > 0 ? ((totalCards - missingTh) / totalCards) * 100 : 0,
    imageCoverage: totalCards > 0 ? ((totalCards - missingImage) / totalCards) * 100 : 0,
    priceCoverage: totalCards > 0 ? (totalWithPrice / totalCards) * 100 : 0,
    totalUsers,
    activeUsers7d,
    newUsers30d,
    tierBreakdown: { free: tierFree, pro: tierPro, proPlus: tierProPlus },
    activePriceAlerts,
    totalListings,
  });
});

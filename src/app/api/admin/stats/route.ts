import { NextResponse } from "next/server";
import { checkIsAdmin } from "@/lib/auth/check-admin";
import { prisma } from "@/lib/db";

export async function GET() {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const [
    totalCards,
    totalSets,
    missingEn,
    missingTh,
    missingImage,
    totalWithPrice,
    parallelCards,
    parallelNoImage,
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
  });
}

import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/api/admin-helpers";
import { adminApiHandler } from "@/lib/api/api-handler";
import { prisma } from "@/lib/db";
import { UpdateAdminSetSchema } from "@/lib/admin/schemas";

export const GET = adminApiHandler(async (_request: NextRequest, _admin) => {
  const sets = await prisma.cardSet.findMany({
    orderBy: { code: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      nameEn: true,
      nameTh: true,
      type: true,
      releaseDate: true,
      cardCount: true,
      packsPerBox: true,
      cardsPerPack: true,
      boxImageUrl: true,
      _count: { select: { cards: true } },
    },
  });

  const setIds = sets.map((s) => s.id);

  const [missingEnGroups, missingImageGroups] = await Promise.all([
    prisma.card.groupBy({
      by: ["setId"],
      where: { setId: { in: setIds }, nameEn: null },
      _count: true,
    }),
    prisma.card.groupBy({
      by: ["setId"],
      where: {
        setId: { in: setIds },
        OR: [{ imageUrl: null }, { imageUrl: "" }],
      },
      _count: true,
    }),
  ]);

  const missingEnMap = new Map(missingEnGroups.map((g) => [g.setId, g._count]));
  const missingImageMap = new Map(missingImageGroups.map((g) => [g.setId, g._count]));

  const enriched = sets.map((s) => {
    const actual = s._count.cards;
    const missingEn = missingEnMap.get(s.id) ?? 0;
    const missingImage = missingImageMap.get(s.id) ?? 0;
    return {
      ...s,
      actualCardCount: actual,
      missingEn,
      missingImage,
      completeness: actual > 0 ? Math.round(((actual - missingEn) / actual) * 100) : 0,
    };
  });

  return NextResponse.json(enriched);
});

export const PATCH = adminApiHandler(async (request: NextRequest, _admin) => {
  const parsed = await parseJsonBody(request, UpdateAdminSetSchema);
  if (!parsed.ok) return parsed.response;

  const { id, ...data } = parsed.body;
  const updated = await prisma.cardSet.update({
    where: { id },
    data,
  });

  return NextResponse.json(updated);
});

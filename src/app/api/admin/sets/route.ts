import { NextRequest, NextResponse } from "next/server";
import { checkIsAdmin } from "@/lib/auth/check-admin";
import { prisma } from "@/lib/db";

export async function GET() {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

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
}

export async function PATCH(request: NextRequest) {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const allowedFields = [
      "nameEn",
      "nameTh",
      "releaseDate",
      "packsPerBox",
      "cardsPerPack",
      "boxImageUrl",
      "msrpJpy",
    ];
    const data: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in updates) {
        if (key === "releaseDate" && updates[key]) {
          data[key] = new Date(updates[key] as string);
        } else {
          data[key] = updates[key];
        }
      }
    }

    const updated = await prisma.cardSet.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/admin/sets:", error);
    return NextResponse.json({ error: "Failed to update set" }, { status: 500 });
  }
}

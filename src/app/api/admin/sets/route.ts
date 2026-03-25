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

  const enriched = await Promise.all(
    sets.map(async (s) => {
      const [missingEn, missingImage] = await Promise.all([
        prisma.card.count({ where: { setId: s.id, nameEn: null } }),
        prisma.card.count({
          where: {
            setId: s.id,
            OR: [{ imageUrl: null }, { imageUrl: "" }],
          },
        }),
      ]);
      const actual = s._count.cards;
      return {
        ...s,
        actualCardCount: actual,
        missingEn,
        missingImage,
        completeness:
          actual > 0
            ? Math.round(((actual - missingEn) / actual) * 100)
            : 0,
      };
    })
  );

  return NextResponse.json(enriched);
}

export async function PATCH(request: NextRequest) {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

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
}

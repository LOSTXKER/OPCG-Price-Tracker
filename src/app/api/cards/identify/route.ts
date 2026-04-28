import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { apiHandler } from "@/lib/api/api-handler";
import { requireAuthUser } from "@/lib/api/auth";
import { prisma } from "@/lib/db";
import { identifyCardFromImage } from "@/lib/gemini/identify-card";

const MAX_SIZE = 8 * 1024 * 1024; // 8 MB
const RESULT_LIMIT = 12;

const CARD_SELECT = {
  id: true,
  cardCode: true,
  baseCode: true,
  nameJp: true,
  nameEn: true,
  nameTh: true,
  rarity: true,
  isParallel: true,
  imageUrl: true,
  latestPriceJpy: true,
  latestPriceThb: true,
  priceChange24h: true,
  priceChange7d: true,
  priceChange30d: true,
  set: { select: { code: true, name: true, nameEn: true } },
} satisfies Prisma.CardSelect;

export const POST = apiHandler(async (req: NextRequest) => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only images allowed" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File too large (max 8MB)" },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  const mimeType = file.type.split(";")[0].trim();

  const identification = await identifyCardFromImage(base64, mimeType);

  if (!identification.isCardImage) {
    return NextResponse.json({
      data: { identification, cards: [] },
    });
  }

  const cards = await searchMatchingCards(identification);

  return NextResponse.json({
    data: { identification, cards },
  });
});

async function searchMatchingCards(
  id: Awaited<ReturnType<typeof identifyCardFromImage>>,
): Promise<Prisma.CardGetPayload<{ select: typeof CARD_SELECT }>[]> {
  // 1. Exact card code → return that card + its parallels first.
  if (id.cardCode) {
    const exact = await prisma.card.findMany({
      where: {
        OR: [
          { cardCode: { equals: id.cardCode, mode: "insensitive" } },
          { baseCode: { equals: id.cardCode, mode: "insensitive" } },
        ],
      },
      take: RESULT_LIMIT,
      orderBy: [{ isParallel: "asc" }, { parallelIndex: "asc" }],
      select: CARD_SELECT,
    });
    if (exact.length > 0) return exact;
  }

  // 2. Fall back to fuzzy name search, optionally narrowed by set hint.
  const nameFilters: Prisma.CardWhereInput[] = [];
  if (id.nameJp) {
    nameFilters.push({ nameJp: { contains: id.nameJp, mode: "insensitive" } });
  }
  if (id.nameEn) {
    nameFilters.push({ nameEn: { contains: id.nameEn, mode: "insensitive" } });
    nameFilters.push({ nameTh: { contains: id.nameEn, mode: "insensitive" } });
  }

  if (nameFilters.length === 0) return [];

  const where: Prisma.CardWhereInput = { OR: nameFilters };
  if (id.setHint) {
    where.set = { code: { equals: id.setHint, mode: "insensitive" } };
  }

  return prisma.card.findMany({
    where,
    take: RESULT_LIMIT,
    orderBy: [
      { latestPriceJpy: { sort: "desc", nulls: "last" } },
      { isParallel: "asc" },
    ],
    select: CARD_SELECT,
  });
}

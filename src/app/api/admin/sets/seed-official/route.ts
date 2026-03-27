import { NextRequest, NextResponse } from "next/server";
import { checkIsAdmin } from "@/lib/auth/check-admin";
import { prisma } from "@/lib/db";
import * as fs from "fs";
import * as path from "path";

interface OfficialCard {
  code: string;
  rarity: string;
  cardType: string;
  nameEn: string;
  nameJp: string;
  nameTh?: string;
  color: string;
  cost?: number;
  power?: number;
  counter?: number;
  life?: number;
  attribute?: string;
  trait: string;
  effectEn?: string;
  effectJp?: string;
  effectTh?: string;
  triggerEn?: string;
  triggerJp?: string;
  imageUrl: string;
  isParallel: boolean;
  parallelIndex?: number;
  cardCode: string;
  sets: string[];
}

const CARD_TYPE_MAP: Record<string, "CHARACTER" | "EVENT" | "STAGE" | "LEADER" | "DON"> = {
  LEADER: "LEADER",
  CHARACTER: "CHARACTER",
  EVENT: "EVENT",
  STAGE: "STAGE",
  "DON!!": "DON",
  DON: "DON",
};

export async function POST(request: NextRequest) {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const setCode = body.setCode as string;
  if (!setCode) {
    return NextResponse.json({ error: "setCode is required" }, { status: 400 });
  }

  const dataDir = path.resolve(process.cwd(), "data", "cards");
  const filePath = path.join(dataDir, `${setCode}.json`);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json(
      { error: `No seed file found: data/cards/${setCode}.json` },
      { status: 404 }
    );
  }

  const cardSet = await prisma.cardSet.findUnique({ where: { code: setCode } });
  if (!cardSet) {
    return NextResponse.json({ error: `Set ${setCode} not found in DB` }, { status: 404 });
  }

  const cards: OfficialCard[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  let created = 0;
  let updated = 0;

  for (const card of cards) {
    const cardType = CARD_TYPE_MAP[card.cardType] || "CHARACTER";

    const data = {
      setId: cardSet.id,
      nameJp: card.nameJp || card.nameEn,
      nameEn: card.nameEn || null,
      nameTh: card.nameTh || null,
      rarity: card.rarity,
      cardType,
      color: card.color || "Unknown",
      colorEn: card.color || null,
      cost: card.cost ?? null,
      power: card.power ?? null,
      counter: card.counter ?? null,
      life: card.life ?? null,
      attribute: card.attribute || null,
      trait: card.trait || null,
      effectJp: card.effectJp || null,
      effectEn: card.effectEn || null,
      effectTh: card.effectTh || null,
      triggerJp: card.triggerJp || null,
      triggerEn: card.triggerEn || null,
      imageUrl: card.imageUrl || null,
      isParallel: card.isParallel ?? false,
      baseCode: card.code,
      parallelIndex: card.parallelIndex ?? null,
    };

    const uniqueCode = card.cardCode || card.code;
    const existing = await prisma.card.findUnique({ where: { cardCode: uniqueCode } });
    if (existing) {
      await prisma.card.update({ where: { cardCode: uniqueCode }, data });
      updated++;
    } else {
      await prisma.card.create({ data: { cardCode: uniqueCode, ...data } });
      created++;
    }
  }

  await prisma.cardSet.update({
    where: { id: cardSet.id },
    data: { cardCount: cards.length },
  });

  return NextResponse.json({ created, updated, total: cards.length });
}

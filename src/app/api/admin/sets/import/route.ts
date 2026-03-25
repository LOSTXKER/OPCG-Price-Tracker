import { NextRequest, NextResponse } from "next/server";
import { checkIsAdmin } from "@/lib/auth/check-admin";
import { prisma } from "@/lib/db";
import { CardType } from "@/generated/prisma/client";

const PUNK_BASE =
  "https://raw.githubusercontent.com/buhbbl/punk-records/main";

interface PunkCard {
  id: string;
  name: string;
  rarity: string;
  category: string;
  colors: string[];
  cost: number | null;
  attributes: string[] | null;
  power: number | null;
  counter: number | null;
  types: string[] | null;
  effect: string | null;
  trigger: string | null;
  life?: number | null;
}

function mapCardType(category: string): CardType {
  const c = category.toUpperCase();
  if (c === "LEADER") return "LEADER";
  if (c === "CHARACTER") return "CHARACTER";
  if (c === "EVENT") return "EVENT";
  if (c === "STAGE") return "STAGE";
  if (c.includes("DON")) return "DON";
  return "CHARACTER";
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

interface PackIds {
  en: string;
  th: string;
}

async function fetchPackIds(): Promise<Map<string, PackIds>> {
  const map = new Map<string, PackIds>();

  const enPacks = await fetchJson<
    Record<string, { id: string; title_parts: { label: string | null } }>
  >(`${PUNK_BASE}/english-asia/packs.json`);
  const thPacks = await fetchJson<
    Record<string, { id: string; title_parts: { label: string | null } }>
  >(`${PUNK_BASE}/thai/packs.json`);

  if (!enPacks || !thPacks)
    throw new Error("Failed to fetch punk-records packs.json");

  const enByLabel = new Map<string, string>();
  const thByLabel = new Map<string, string>();

  for (const [id, pack] of Object.entries(enPacks)) {
    if (pack.title_parts.label) {
      enByLabel.set(
        pack.title_parts.label.toLowerCase().replace(/-/g, ""),
        id
      );
    }
  }
  for (const [id, pack] of Object.entries(thPacks)) {
    if (pack.title_parts.label) {
      thByLabel.set(
        pack.title_parts.label.toLowerCase().replace(/-/g, ""),
        id
      );
    }
  }

  for (const [label, enId] of enByLabel) {
    const thId = thByLabel.get(label);
    map.set(label, { en: enId, th: thId || "" });
  }

  return map;
}

export async function POST(request: NextRequest) {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const setCode: string = body.setCode;

  if (!setCode) {
    return NextResponse.json(
      { error: "setCode is required" },
      { status: 400 }
    );
  }

  const dbSet = await prisma.cardSet.findUnique({
    where: { code: setCode },
  });

  if (!dbSet) {
    return NextResponse.json(
      { error: `Set ${setCode} not found in DB. Run price scrape first.` },
      { status: 404 }
    );
  }

  const packMap = await fetchPackIds();
  const normalizedCode = setCode.toLowerCase().replace(/-/g, "");
  const ids = packMap.get(normalizedCode);

  if (!ids) {
    return NextResponse.json(
      { error: `No punk-records pack found for ${setCode}` },
      { status: 404 }
    );
  }

  const enData = await fetchJson<Record<string, PunkCard>>(
    `${PUNK_BASE}/english-asia/data/${ids.en}.json`
  );
  const thData = ids.th
    ? await fetchJson<Record<string, PunkCard>>(
        `${PUNK_BASE}/thai/data/${ids.th}.json`
      )
    : null;

  if (!enData) {
    return NextResponse.json(
      { error: "Failed to fetch EN data from punk-records" },
      { status: 502 }
    );
  }

  const enLookup = new Map<string, PunkCard>();
  const thLookup = new Map<string, PunkCard>();

  for (const card of Object.values(enData)) {
    enLookup.set(card.id, card);
  }
  if (thData) {
    for (const card of Object.values(thData)) {
      thLookup.set(card.id, card);
    }
  }

  const dbCards = await prisma.card.findMany({
    where: { setId: dbSet.id },
    select: {
      id: true,
      baseCode: true,
      nameEn: true,
      nameTh: true,
      effectEn: true,
      effectTh: true,
      colorEn: true,
      cardType: true,
      cost: true,
      power: true,
      counter: true,
      life: true,
      attribute: true,
      trait: true,
      triggerEn: true,
    },
  });

  // Fetch origin set data for cross-set cards
  const missingBaseCodes = dbCards
    .filter((db) => db.baseCode && !enLookup.has(db.baseCode))
    .map((db) => db.baseCode!);
  const neededSets = new Set(
    (
      missingBaseCodes
        .map((bc) => {
          const m = bc.match(/^(OP\d+|EB\d+|ST\d+|PRB\d+)/i);
          return m ? m[1].toLowerCase().replace(/-/g, "") : null;
        })
        .filter(Boolean) as string[]
    )
  );

  for (const originSet of neededSets) {
    const originIds = packMap.get(originSet);
    if (!originIds) continue;
    const originEn = await fetchJson<Record<string, PunkCard>>(
      `${PUNK_BASE}/english-asia/data/${originIds.en}.json`
    );
    const originTh = originIds.th
      ? await fetchJson<Record<string, PunkCard>>(
          `${PUNK_BASE}/thai/data/${originIds.th}.json`
        )
      : null;
    if (originEn) {
      for (const card of Object.values(originEn)) {
        if (!enLookup.has(card.id)) enLookup.set(card.id, card);
      }
    }
    if (originTh) {
      for (const card of Object.values(originTh)) {
        if (!thLookup.has(card.id)) thLookup.set(card.id, card);
      }
    }
  }

  let updated = 0;
  let noMatch = 0;

  for (const db of dbCards) {
    if (!db.baseCode) continue;
    const en = enLookup.get(db.baseCode);
    const th = thLookup.get(db.baseCode);

    if (!en) {
      noMatch++;
      continue;
    }

    const updates: Record<string, unknown> = {};

    if (!db.nameEn && en.name) updates.nameEn = en.name;
    if (!db.effectEn && en.effect) updates.effectEn = en.effect;
    if (!db.colorEn && en.colors?.length) updates.colorEn = en.colors.join("/");
    if (!db.triggerEn && en.trigger) updates.triggerEn = en.trigger;
    if (db.cardType === "CHARACTER" && en.category) {
      const mapped = mapCardType(en.category);
      if (mapped !== db.cardType) updates.cardType = mapped;
    }
    if (db.cost === null && en.cost != null) updates.cost = en.cost;
    if (db.power === null && en.power != null) updates.power = en.power;
    if (db.counter === null && en.counter != null) updates.counter = en.counter;
    if (db.life === null && en.life != null) updates.life = en.life;
    if (db.attribute === null && en.attributes?.length)
      updates.attribute = en.attributes.join("/");
    if (db.trait === null && en.types?.length)
      updates.trait = en.types.join("/");

    if (th) {
      if (!db.nameTh && th.name) updates.nameTh = th.name;
      if (!db.effectTh && th.effect) updates.effectTh = th.effect;
    }

    if (Object.keys(updates).length > 0) {
      await prisma.card.update({ where: { id: db.id }, data: updates });
      updated++;
    }
  }

  // Also populate Product + ProductCard for this pack
  const product = await prisma.product.upsert({
    where: { code: setCode },
    update: { nameEn: dbSet.nameEn ?? undefined },
    create: {
      code: setCode,
      name: dbSet.name,
      nameEn: dbSet.nameEn,
      type: dbSet.type,
    },
  });

  // Link all cards from punk-records pack to this product
  let productLinked = 0;
  const allPunkCardIds = [...enLookup.keys()];
  for (const cardId of allPunkCardIds) {
    const dbCard = await prisma.card.findUnique({
      where: { cardCode: cardId },
      select: { id: true },
    });
    if (!dbCard) continue;

    await prisma.productCard.upsert({
      where: {
        productId_cardId: { productId: product.id, cardId: dbCard.id },
      },
      update: {},
      create: { productId: product.id, cardId: dbCard.id },
    });
    productLinked++;
  }

  return NextResponse.json({
    success: true,
    setCode,
    totalCards: dbCards.length,
    updated,
    noMatch,
    productLinked,
    enAvailable: enLookup.size,
    thAvailable: thLookup.size,
  });
}

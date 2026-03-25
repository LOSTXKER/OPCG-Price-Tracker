/**
 * Enrich cards with data from punk-records (Bandai official, multi-language).
 * Fetches EN + TH data, updates text fields only — never touches imageUrl.
 *
 * Usage:
 *   npx tsx scripts/enrich-card-data.ts
 *   --set op13  : only process a specific set
 */
import "dotenv/config";
import { PrismaClient, CardType } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const cs = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!cs) throw new Error("DATABASE_URL or DIRECT_URL required");
const adapter = new PrismaPg({ connectionString: cs });
const prisma = new PrismaClient({ adapter });

const PUNK_BASE = "https://raw.githubusercontent.com/buhbbl/punk-records/main";

const args = process.argv.slice(2);
const SET_FILTER = args.find((_, i, a) => a[i - 1] === "--set") ?? null;

// Pack ID mapping: set code → { en: packId, th: packId }
// EN uses 556xxx, TH uses 563xxx
interface PackIds { en: string; th: string }

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

async function fetchPackIds(): Promise<Map<string, PackIds>> {
  const map = new Map<string, PackIds>();

  const enPacks = await fetchJson<Record<string, { id: string; title_parts: { label: string | null } }>>(
    `${PUNK_BASE}/english-asia/packs.json`
  );
  const thPacks = await fetchJson<Record<string, { id: string; title_parts: { label: string | null } }>>(
    `${PUNK_BASE}/thai/packs.json`
  );

  if (!enPacks || !thPacks) throw new Error("Failed to fetch packs.json");

  // Build label → packId for each language
  const enByLabel = new Map<string, string>();
  const thByLabel = new Map<string, string>();

  for (const [id, pack] of Object.entries(enPacks)) {
    if (pack.title_parts.label) {
      enByLabel.set(pack.title_parts.label.toLowerCase().replace(/-/g, ""), id);
    }
  }
  for (const [id, pack] of Object.entries(thPacks)) {
    if (pack.title_parts.label) {
      thByLabel.set(pack.title_parts.label.toLowerCase().replace(/-/g, ""), id);
    }
  }

  for (const [label, enId] of enByLabel) {
    const thId = thByLabel.get(label);
    if (thId) {
      map.set(label, { en: enId, th: thId });
    } else {
      map.set(label, { en: enId, th: "" });
    }
  }

  return map;
}

async function main() {
  console.log("=== Enrich Card Data from punk-records ===\n");

  // Fetch pack ID mapping
  console.log("Fetching pack ID mappings...");
  const packMap = await fetchPackIds();
  console.log(`  ${packMap.size} sets mapped\n`);

  // Get DB sets to process
  const setsWhere = SET_FILTER ? { code: SET_FILTER } : {};
  const dbSets = await prisma.cardSet.findMany({ where: setsWhere, select: { id: true, code: true } });
  console.log(`Sets to process: ${dbSets.length}\n`);

  let totalUpdated = 0, totalEnriched = 0, totalNoMatch = 0;

  for (const dbSet of dbSets) {
    const normalizedCode = dbSet.code.toLowerCase().replace(/-/g, "");
    const ids = packMap.get(normalizedCode);

    if (!ids) {
      console.log(`[${dbSet.code}] No pack ID found, skipping`);
      totalNoMatch++;
      continue;
    }

    console.log(`[${dbSet.code}] EN=${ids.en} TH=${ids.th}`);

    // Fetch EN + TH card data
    const enData = await fetchJson<Record<string, PunkCard>>(`${PUNK_BASE}/english-asia/data/${ids.en}.json`);
    const thData = ids.th ? await fetchJson<Record<string, PunkCard>>(`${PUNK_BASE}/thai/data/${ids.th}.json`) : null;

    if (!enData) {
      console.log(`  EN data not found, skipping`);
      continue;
    }

    // Build lookup by card ID (e.g., "OP13-001")
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

    console.log(`  EN: ${enLookup.size} cards, TH: ${thLookup.size} cards`);

    // Load DB cards for this set
    const dbCards = await prisma.card.findMany({
      where: { setId: dbSet.id },
      select: {
        id: true, baseCode: true, nameEn: true, nameTh: true,
        effectEn: true, effectTh: true, colorEn: true,
        cardType: true, cost: true, power: true, counter: true,
        life: true, attribute: true, trait: true, triggerEn: true,
      },
    });

    // For cross-set cards (e.g., OP09-004 in OP13), fetch their origin set data
    const missingBaseCodes = dbCards
      .filter(db => db.baseCode && !enLookup.has(db.baseCode))
      .map(db => db.baseCode!);
    const neededSets = new Set(missingBaseCodes.map(bc => {
      const m = bc.match(/^(OP\d+|EB\d+|ST\d+|PRB\d+)/i);
      return m ? m[1].toLowerCase().replace(/-/g, "") : null;
    }).filter(Boolean) as string[]);

    for (const originSet of neededSets) {
      const originIds = packMap.get(originSet);
      if (!originIds) continue;
      const originEn = await fetchJson<Record<string, PunkCard>>(`${PUNK_BASE}/english-asia/data/${originIds.en}.json`);
      const originTh = originIds.th ? await fetchJson<Record<string, PunkCard>>(`${PUNK_BASE}/thai/data/${originIds.th}.json`) : null;
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
      console.log(`  + Fetched origin set ${originSet} for cross-set cards`);
    }

    let setUpdated = 0;
    for (const db of dbCards) {
      if (!db.baseCode) continue;
      const en = enLookup.get(db.baseCode);
      const th = thLookup.get(db.baseCode);

      if (!en) { totalNoMatch++; continue; }

      const updates: Record<string, unknown> = {};

      // EN data
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
      if (db.attribute === null && en.attributes?.length) updates.attribute = en.attributes.join("/");
      if (db.trait === null && en.types?.length) updates.trait = en.types.join("/");

      // TH data
      if (th) {
        if (!db.nameTh && th.name) updates.nameTh = th.name;
        if (!db.effectTh && th.effect) updates.effectTh = th.effect;
      }

      if (Object.keys(updates).length > 0) {
        await prisma.card.update({ where: { id: db.id }, data: updates });
        setUpdated++;
        if (updates.nameEn || updates.nameTh) totalEnriched++;
      }
    }

    totalUpdated += setUpdated;
    console.log(`  Updated: ${setUpdated}/${dbCards.length}\n`);
  }

  console.log("=== Results ===");
  console.log(`  Total updated: ${totalUpdated}`);
  console.log(`  Got names (EN/TH): ${totalEnriched}`);
  console.log(`  No match: ${totalNoMatch}`);

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });

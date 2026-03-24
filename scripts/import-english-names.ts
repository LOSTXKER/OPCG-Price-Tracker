import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL or DIRECT_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const GH_BASE =
  "https://raw.githubusercontent.com/buhbbl/punk-records/main/english-asia";
const OPCG_CODE_RE = /^((?:OP|ST|EB|PRB|P)\d+-\d+)/i;

interface PunkPack {
  id: string;
  raw_title: string;
  title_parts: { prefix: string; title: string; label: string };
}

interface PunkCard {
  id: string;
  pack_id: string;
  name: string;
  category: string;
  colors: string[];
  cost: number | null;
  power: number | null;
  counter: number | null;
  effect: string | null;
  trigger: string | null;
  attributes: string[];
  types: string[];
  rarity: string;
  img_full_url: string;
}

const CATEGORY_MAP: Record<string, string> = {
  Character: "CHARACTER",
  Leader: "LEADER",
  Event: "EVENT",
  Stage: "STAGE",
};

function extractOpcgCode(
  cardCode: string,
  yuyuteiId: string | null
): string | null {
  let base = cardCode;
  if (yuyuteiId && base.endsWith(`-${yuyuteiId}`)) {
    base = base.slice(0, -(yuyuteiId.length + 1));
  }
  const m = base.match(OPCG_CODE_RE);
  return m ? m[1].toUpperCase() : null;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json() as Promise<T>;
}

async function main() {
  console.log("=== punk-records Full Data Import ===\n");

  // 1. Fetch packs index to get all pack IDs
  console.log("Fetching packs index...");
  const packs = await fetchJson<Record<string, PunkPack>>(
    `${GH_BASE}/packs.json`
  );
  const packIds = Object.keys(packs);
  console.log(`  Found ${packIds.length} packs.\n`);

  // 2. Fetch full card data from each pack
  console.log("Downloading full card data...");
  const allPunkCards = new Map<string, PunkCard>();

  for (const packId of packIds) {
    const url = `${GH_BASE}/data/${packId}.json`;
    try {
      const cards = await fetchJson<PunkCard[]>(url);
      for (const card of cards) {
        const baseCode = card.id.replace(/_p\d+$/, "").toUpperCase();
        if (!allPunkCards.has(baseCode)) {
          allPunkCards.set(baseCode, card);
        }
      }
      const label = packs[packId]?.title_parts?.label ?? packId;
      process.stdout.write(`\r  Loaded ${allPunkCards.size} cards (${label})   `);
    } catch {
      console.warn(`\n  Warning: could not fetch pack ${packId}`);
    }
  }
  console.log(`\r  Loaded ${allPunkCards.size} unique cards from ${packIds.length} packs.\n`);

  // 3. Fetch all DB cards
  console.log("Fetching cards from database...");
  const dbCards = await prisma.card.findMany({
    select: {
      id: true,
      cardCode: true,
      yuyuteiId: true,
      cardType: true,
      color: true,
    },
    orderBy: { cardCode: "asc" },
  });
  console.log(`  Found ${dbCards.length} cards in DB.\n`);

  // 4. Match and update
  console.log("Updating cards...");
  let updated = 0;
  let noMatch = 0;

  for (let i = 0; i < dbCards.length; i++) {
    const card = dbCards[i];
    const opcgCode = extractOpcgCode(card.cardCode, card.yuyuteiId);

    if (!opcgCode) {
      noMatch++;
      continue;
    }

    const punk = allPunkCards.get(opcgCode);
    if (!punk) {
      noMatch++;
      continue;
    }

    const isLeader = punk.category === "Leader";
    const cardType = CATEGORY_MAP[punk.category] ?? card.cardType;
    const colorStr = punk.colors.join("/") || undefined;

    const data: Record<string, unknown> = {
      nameEn: punk.name,
      effectEn: punk.effect || null,
      triggerJp: punk.trigger || null,
      attribute: punk.attributes.length > 0 ? punk.attributes.join(" / ") : null,
      trait: punk.types.length > 0 ? punk.types.join(" / ") : null,
      colorEn: colorStr,
    };

    if (cardType && cardType !== card.cardType) {
      data.cardType = cardType;
    }

    if (colorStr && card.color === "Unknown") {
      data.color = colorStr;
    }

    if (isLeader) {
      if (punk.cost != null) data.life = punk.cost;
      if (punk.power != null) data.power = punk.power;
    } else {
      if (punk.cost != null) data.cost = punk.cost;
      if (punk.power != null) data.power = punk.power;
      if (punk.counter != null) data.counter = punk.counter;
    }

    await prisma.card.update({
      where: { id: card.id },
      data,
    });
    updated++;

    if ((i + 1) % 100 === 0) {
      process.stdout.write(
        `\r  Progress: ${i + 1}/${dbCards.length} | Updated: ${updated} | No match: ${noMatch}`
      );
    }
  }

  console.log(
    `\r  Progress: ${dbCards.length}/${dbCards.length} | Updated: ${updated} | No match: ${noMatch}`
  );
  console.log("\n========================================");
  console.log(`Done! ${updated} cards updated with full metadata.`);
  console.log(`  No match in punk-records: ${noMatch}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });

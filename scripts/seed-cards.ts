import { prisma } from "./_db";
import { SETS } from "./sets";
import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.resolve(__dirname, "..", "data", "cards");

interface OfficialCard {
  code: string;
  cardCode: string;
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
  sets: string[];
}

const CARD_TYPE_MAP: Record<string, string> = {
  LEADER: "LEADER",
  CHARACTER: "CHARACTER",
  EVENT: "EVENT",
  STAGE: "STAGE",
  "DON!!": "DON",
  DON: "DON",
};

async function main() {
  const wipeFlag = process.argv.includes("--wipe");
  const targetSets = process.argv.filter((a) => !a.startsWith("-") && a !== process.argv[0] && a !== process.argv[1]);

  console.log("=== Seed Cards from Official Data ===\n");

  if (wipeFlag) {
    console.log("Wiping all card-related data...");
    await prisma.$transaction([
      prisma.cardPrice.deleteMany(),
      prisma.productCard.deleteMany(),
      prisma.deckCard.deleteMany(),
      prisma.listing.deleteMany(),
      prisma.communityPrice.deleteMany(),
      prisma.portfolioTransaction.deleteMany(),
      prisma.portfolioItem.deleteMany(),
      prisma.watchlistItem.deleteMany(),
      prisma.priceAlert.deleteMany(),
    ]);
    await prisma.card.deleteMany();
    await prisma.setDropRate.deleteMany();
    await prisma.cardSet.deleteMany();
    console.log("  Wiped all data.\n");
  }

  console.log("Upserting card sets...");
  const setIdMap = new Map<string, number>();
  for (const s of SETS) {
    const set = await prisma.cardSet.upsert({
      where: { code: s.code },
      update: { name: s.nameJp, nameEn: s.nameEn, type: s.type },
      create: { code: s.code, name: s.nameJp, nameEn: s.nameEn, type: s.type },
    });
    setIdMap.set(s.code, set.id);
  }
  console.log(`  ${setIdMap.size} sets upserted.\n`);

  const seedFiles = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
  const filesToProcess = targetSets.length > 0
    ? seedFiles.filter((f) => targetSets.includes(f.replace(".json", "")))
    : seedFiles;

  console.log(`Processing ${filesToProcess.length} seed files...\n`);

  let totalCreated = 0;
  let totalUpdated = 0;

  for (const file of filesToProcess) {
    const setCode = file.replace(".json", "");
    const setId = setIdMap.get(setCode);
    if (!setId) {
      console.warn(`  [${setCode}] No matching CardSet, skipping`);
      continue;
    }

    const filePath = path.join(DATA_DIR, file);
    const cards: OfficialCard[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    console.log(`  [${setCode}] ${cards.length} cards...`);

    let created = 0;
    let updated = 0;

    for (const card of cards) {
      const cardType = CARD_TYPE_MAP[card.cardType] || "CHARACTER";
      const uniqueCode = card.cardCode || card.code;

      const data = {
        setId,
        nameJp: card.nameJp || card.nameEn,
        nameEn: card.nameEn || null,
        nameTh: card.nameTh || null,
        rarity: card.rarity,
        cardType: cardType as "CHARACTER" | "EVENT" | "STAGE" | "LEADER" | "DON",
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
      where: { id: setId },
      data: { cardCount: cards.length },
    });

    console.log(`    Created: ${created}, Updated: ${updated}`);
    totalCreated += created;
    totalUpdated += updated;
  }

  console.log(`\n========================================`);
  console.log(`Done! Created: ${totalCreated}, Updated: ${totalUpdated}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

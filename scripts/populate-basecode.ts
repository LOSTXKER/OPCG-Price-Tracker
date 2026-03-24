import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL or DIRECT_URL is not set");

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const BANDAI_BASE = "https://www.onepiece-cardgame.com/images/cardlist/card";
const OPCG_CODE_RE = /^((?:OP|ST|EB|PRB|P)\d+-\d+)/i;

function extractBaseCode(
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

async function checkImageExists(url: string): Promise<boolean> {
  try {
    const r = await fetch(url, { method: "HEAD", headers: { "User-Agent": "Mozilla/5.0" } });
    return r.status === 200;
  } catch {
    return false;
  }
}

async function main() {
  console.log("=== Populate baseCode + parallelIndex + Bandai HD Images ===\n");

  const allCards = await prisma.card.findMany({
    select: {
      id: true,
      cardCode: true,
      yuyuteiId: true,
      isParallel: true,
      latestPriceJpy: true,
    },
    orderBy: { cardCode: "asc" },
  });
  console.log(`Found ${allCards.length} cards in DB.\n`);

  // Step 1: Populate baseCode for all cards
  console.log("Step 1: Populating baseCode...");
  const baseCodeMap = new Map<string, typeof allCards>();

  for (const card of allCards) {
    const baseCode = extractBaseCode(card.cardCode, card.yuyuteiId);
    if (baseCode) {
      if (!baseCodeMap.has(baseCode)) baseCodeMap.set(baseCode, []);
      baseCodeMap.get(baseCode)!.push(card);
    }
  }
  console.log(`  ${baseCodeMap.size} unique base codes found.\n`);

  // Step 2: For each group, assign parallelIndex and Bandai HD images
  console.log("Step 2: Assigning parallelIndex + images...");
  let updated = 0;
  let noCode = 0;
  let checkedUrls = 0;
  const groupEntries = [...baseCodeMap.entries()];

  for (let g = 0; g < groupEntries.length; g++) {
    const [baseCode, cards] = groupEntries[g];

    // Separate base and parallel cards
    const baseCards = cards.filter((c) => !c.isParallel);
    const parallelCards = cards
      .filter((c) => c.isParallel)
      .sort((a, b) => (a.latestPriceJpy ?? 0) - (b.latestPriceJpy ?? 0));

    // Assign base cards
    for (const card of baseCards) {
      const imageUrl = `${BANDAI_BASE}/${baseCode}.png`;
      await prisma.card.update({
        where: { id: card.id },
        data: { baseCode, parallelIndex: null, imageUrl },
      });
      updated++;
    }

    // Assign parallel cards sorted by price (cheapest = _p1)
    for (let i = 0; i < parallelCards.length; i++) {
      const pIndex = i + 1;
      const imageUrl = `${BANDAI_BASE}/${baseCode}_p${pIndex}.png`;
      await prisma.card.update({
        where: { id: parallelCards[i].id },
        data: { baseCode, parallelIndex: pIndex, imageUrl },
      });
      updated++;
    }

    if ((g + 1) % 100 === 0) {
      process.stdout.write(
        `\r  Progress: ${g + 1}/${groupEntries.length} groups | Updated: ${updated}`
      );
    }
  }

  // Handle cards without valid OPCG codes (DON cards etc.)
  for (const card of allCards) {
    const baseCode = extractBaseCode(card.cardCode, card.yuyuteiId);
    if (!baseCode) {
      noCode++;
    }
  }

  console.log(
    `\r  Progress: ${groupEntries.length}/${groupEntries.length} groups | Updated: ${updated}`
  );
  console.log(`  No valid OPCG code (DON cards): ${noCode}\n`);

  // Step 3: Validate a sample of parallel images exist on Bandai CDN
  console.log("Step 3: Validating parallel images on Bandai CDN (sample)...");
  const sampleParallels = await prisma.card.findMany({
    where: { isParallel: true, parallelIndex: { not: null } },
    select: { cardCode: true, baseCode: true, parallelIndex: true, imageUrl: true },
    take: 20,
  });

  let valid = 0;
  let invalid = 0;
  for (const p of sampleParallels) {
    if (!p.imageUrl) continue;
    const exists = await checkImageExists(p.imageUrl);
    if (exists) {
      valid++;
    } else {
      invalid++;
      console.log(`  MISSING: ${p.cardCode} → ${p.imageUrl}`);
    }
    checkedUrls++;
  }
  console.log(`  Checked ${checkedUrls} | Valid: ${valid} | Missing: ${invalid}\n`);

  console.log("========================================");
  console.log(`Done! ${updated} cards updated with baseCode + parallelIndex + Bandai HD images.`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

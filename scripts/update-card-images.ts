import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL or DIRECT_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const BANDAI_BASE = "https://www.onepiece-cardgame.com/images/cardlist/card";

const OPCG_CODE_RE = /^((?:OP|ST|EB|PRB|P)\d+-\d+)/i;

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

function getBandaiImageUrl(opcgCode: string): string {
  return `${BANDAI_BASE}/${opcgCode}.png`;
}

async function main() {
  console.log("Fetching non-parallel cards from database...");
  const allCards = await prisma.card.findMany({
    where: { isParallel: false },
    select: { id: true, cardCode: true, imageUrl: true, yuyuteiId: true },
    orderBy: { cardCode: "asc" },
  });

  console.log(`Found ${allCards.length} cards.\n`);

  let updated = 0;
  let skipped = 0;
  let noCode = 0;

  for (let i = 0; i < allCards.length; i++) {
    const card = allCards[i];
    const opcgCode = extractOpcgCode(card.cardCode, card.yuyuteiId);

    if (!opcgCode) {
      noCode++;
      continue;
    }

    const bandaiUrl = getBandaiImageUrl(opcgCode);

    if (card.imageUrl === bandaiUrl) {
      skipped++;
      continue;
    }

    await prisma.card.update({
      where: { id: card.id },
      data: { imageUrl: bandaiUrl },
    });
    updated++;

    if ((i + 1) % 100 === 0) {
      process.stdout.write(
        `\r  Progress: ${i + 1}/${allCards.length} | Updated: ${updated} | Skipped: ${skipped} | No OPCG code: ${noCode}`
      );
    }
  }

  console.log(
    `\r  Progress: ${allCards.length}/${allCards.length} | Updated: ${updated} | Skipped: ${skipped} | No OPCG code: ${noCode}`
  );
  console.log("\n========================================");
  console.log(`Done! ${updated} cards updated to official Bandai HD images.`);
  console.log(`  Already up-to-date: ${skipped}`);
  console.log(`  Skipped (no valid OPCG code, e.g. DON!! cards): ${noCode}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });

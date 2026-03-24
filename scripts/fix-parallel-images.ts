import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

function getYuyuteiImageUrl(setCode: string, yuyuteiId: string): string {
  return `https://card.yuyu-tei.jp/opc/200_280/${setCode}/${yuyuteiId}.jpg`;
}

async function main() {
  console.log("=== Fix Parallel Card Images ===\n");
  console.log("Parallel cards need Yuyu-tei images (unique artwork per variant).");
  console.log("Base cards keep Bandai CDN images (higher quality).\n");

  const parallels = await prisma.card.findMany({
    where: { isParallel: true },
    select: {
      id: true,
      cardCode: true,
      yuyuteiId: true,
      imageUrl: true,
      set: { select: { code: true } },
    },
    orderBy: { cardCode: "asc" },
  });

  console.log(`Found ${parallels.length} parallel cards.\n`);

  let updated = 0;
  let skipped = 0;
  let noId = 0;

  for (let i = 0; i < parallels.length; i++) {
    const card = parallels[i];

    if (!card.yuyuteiId || !card.set?.code) {
      noId++;
      continue;
    }

    const yuyuUrl = getYuyuteiImageUrl(card.set.code, card.yuyuteiId);

    if (card.imageUrl === yuyuUrl) {
      skipped++;
      continue;
    }

    await prisma.card.update({
      where: { id: card.id },
      data: { imageUrl: yuyuUrl },
    });
    updated++;

    if ((i + 1) % 50 === 0) {
      process.stdout.write(
        `\r  Progress: ${i + 1}/${parallels.length} | Updated: ${updated} | Skipped: ${skipped}`
      );
    }
  }

  console.log(
    `\r  Progress: ${parallels.length}/${parallels.length} | Updated: ${updated} | Skipped: ${skipped} | No ID: ${noId}`
  );
  console.log("\nDone!");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const OPTCG_API = "https://optcgapi.com/api/sets/card";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function mapCardType(type: string | undefined): "CHARACTER" | "EVENT" | "STAGE" | "LEADER" | "DON" {
  switch (type?.toUpperCase()) {
    case "CHARACTER": return "CHARACTER";
    case "EVENT": return "EVENT";
    case "STAGE": return "STAGE";
    case "LEADER": return "LEADER";
    case "DON!!": return "DON";
    default: return "CHARACTER";
  }
}

async function main() {
  console.log("=== Enriching cards from OPTCG API ===\n");

  const allCards = await prisma.card.findMany({
    select: { id: true, cardCode: true, baseCode: true, isParallel: true, parallelIndex: true, nameEn: true },
    orderBy: { cardCode: "asc" },
  });

  console.log(`Total cards in DB: ${allCards.length}`);

  // Get unique base codes
  const baseCodes = new Set<string>();
  for (const card of allCards) {
    if (card.baseCode) baseCodes.add(card.baseCode);
  }

  console.log(`Unique base codes: ${baseCodes.size}\n`);

  let enriched = 0;
  let skipped = 0;
  let apiErrors = 0;

  for (const baseCode of baseCodes) {
    try {
      const res = await fetch(`${OPTCG_API}/${baseCode}/?format=json`);
      if (!res.ok) {
        skipped++;
        continue;
      }

      const variants: Array<{
        card_name: string;
        card_image_id: string;
        card_color: string;
        card_type: string;
        card_cost: string | null;
        card_power: string | null;
        counter_amount: number | null;
        attribute: string | null;
        sub_types: string | null;
        card_text: string | null;
        life: string | null;
        rarity: string;
      }> = await res.json();

      if (!Array.isArray(variants) || variants.length === 0) {
        skipped++;
        continue;
      }

      const baseMeta = variants[0];

      // Update all cards with this baseCode
      const dbCards = allCards.filter((c) => c.baseCode === baseCode);

      for (const dbCard of dbCards) {
        // Find matching OPTCG variant
        let optcgMatch = null;

        if (!dbCard.isParallel) {
          optcgMatch = variants.find((v) => v.card_image_id === baseCode);
        } else if (dbCard.parallelIndex) {
          optcgMatch = variants.find((v) => v.card_image_id === `${baseCode}_p${dbCard.parallelIndex}`);
        }

        const nameEn = optcgMatch?.card_name || baseMeta.card_name;
        const cardType = mapCardType(baseMeta.card_type);

        await prisma.card.update({
          where: { id: dbCard.id },
          data: {
            nameEn,
            color: baseMeta.card_color || "Unknown",
            colorEn: baseMeta.card_color || null,
            cardType,
            cost: baseMeta.card_cost ? parseInt(baseMeta.card_cost) : null,
            power: baseMeta.card_power ? parseInt(baseMeta.card_power) : null,
            counter: baseMeta.counter_amount || null,
            life: baseMeta.life ? parseInt(baseMeta.life) : null,
            attribute: baseMeta.attribute || null,
            trait: baseMeta.sub_types || null,
            effectEn: baseMeta.card_text || null,
          },
        });

        enriched++;
      }

      process.stdout.write(`  ${baseCode} ✓ (${dbCards.length} cards)\n`);
    } catch (err) {
      apiErrors++;
      console.error(`  ${baseCode} ✗ ${err}`);
    }

    await sleep(150);
  }

  console.log(`\n=== Summary ===`);
  console.log(`Enriched: ${enriched} cards`);
  console.log(`Skipped (not in OPTCG): ${skipped} base codes`);
  console.log(`API errors: ${apiErrors}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });

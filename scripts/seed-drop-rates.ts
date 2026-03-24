import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL or DIRECT_URL is not set");

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// Community-estimated pull rates for standard OPCG booster boxes (24 packs, 12 cards/pack)
// Source: cardcosmos.de, reddit r/OnePieceTCG, onepiece.gg
const BOOSTER_RATES: Record<string, { avgPerBox: number; ratePerPack: number }> = {
  L:   { avgPerBox: 0,    ratePerPack: 0      },
  C:   { avgPerBox: 120,  ratePerPack: 5.0    },
  UC:  { avgPerBox: 72,   ratePerPack: 3.0    },
  R:   { avgPerBox: 48,   ratePerPack: 2.0    },
  SR:  { avgPerBox: 4.5,  ratePerPack: 0.1875 },
  SEC: { avgPerBox: 0.5,  ratePerPack: 0.0208 },
  SP:  { avgPerBox: 0.2,  ratePerPack: 0.0083 },
};

const EXTRA_BOOSTER_RATES: Record<string, { avgPerBox: number; ratePerPack: number }> = {
  ...BOOSTER_RATES,
};

const STARTER_RATES: Record<string, { avgPerBox: number; ratePerPack: number }> = {
  L:  { avgPerBox: 1, ratePerPack: 1 },
  C:  { avgPerBox: 30, ratePerPack: 30 },
  UC: { avgPerBox: 10, ratePerPack: 10 },
  R:  { avgPerBox: 5, ratePerPack: 5 },
  SR: { avgPerBox: 2, ratePerPack: 2 },
};

async function main() {
  console.log("=== Seed Drop Rates ===\n");

  const sets = await prisma.cardSet.findMany({
    orderBy: { code: "asc" },
  });

  console.log(`Found ${sets.length} sets.\n`);

  let created = 0;
  let updated = 0;

  for (const set of sets) {
    let rates: Record<string, { avgPerBox: number; ratePerPack: number }>;
    let packsPerBox: number;
    let cardsPerPack: number;

    switch (set.type) {
      case "BOOSTER":
        rates = BOOSTER_RATES;
        packsPerBox = 24;
        cardsPerPack = 12;
        break;
      case "EXTRA_BOOSTER":
        rates = EXTRA_BOOSTER_RATES;
        packsPerBox = 24;
        cardsPerPack = 12;
        break;
      case "STARTER":
        rates = STARTER_RATES;
        packsPerBox = 1;
        cardsPerPack = 51;
        break;
      default:
        rates = BOOSTER_RATES;
        packsPerBox = 24;
        cardsPerPack = 12;
        break;
    }

    await prisma.cardSet.update({
      where: { id: set.id },
      data: { packsPerBox, cardsPerPack },
    });

    const rarityCounts = await prisma.card.groupBy({
      by: ["rarity"],
      where: { setId: set.id, isParallel: false },
      _count: true,
    });

    const existingRarities = new Set(rarityCounts.map((r) => r.rarity));

    for (const [rarity, rate] of Object.entries(rates)) {
      if (!existingRarities.has(rarity)) continue;

      const result = await prisma.setDropRate.upsert({
        where: { setId_rarity: { setId: set.id, rarity } },
        update: { avgPerBox: rate.avgPerBox, ratePerPack: rate.ratePerPack },
        create: {
          setId: set.id,
          rarity,
          avgPerBox: rate.avgPerBox,
          ratePerPack: rate.ratePerPack,
        },
      });

      if (result.id) created++;
    }

    // Handle P- prefixed rarities (parallel rarities)
    for (const rc of rarityCounts) {
      if (!rc.rarity.startsWith("P-")) continue;
      const baseRarity = rc.rarity.replace("P-", "");
      const baseRate = rates[baseRarity];
      if (!baseRate) continue;

      const parallelRate = {
        avgPerBox: Math.min(baseRate.avgPerBox * 0.1, 2),
        ratePerPack: Math.min(baseRate.ratePerPack * 0.1, 0.08),
      };

      await prisma.setDropRate.upsert({
        where: { setId_rarity: { setId: set.id, rarity: rc.rarity } },
        update: { avgPerBox: parallelRate.avgPerBox, ratePerPack: parallelRate.ratePerPack },
        create: {
          setId: set.id,
          rarity: rc.rarity,
          avgPerBox: parallelRate.avgPerBox,
          ratePerPack: parallelRate.ratePerPack,
        },
      });
      created++;
    }

    console.log(`  [${set.code}] ${set.name}: seeded ${existingRarities.size} rarity rates`);
    updated++;
  }

  console.log(`\n========================================`);
  console.log(`Done! Updated ${updated} sets, created/updated ${created} drop rate entries.`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

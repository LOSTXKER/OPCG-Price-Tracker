import { prisma } from "./_db";

/**
 * Community-estimated pull rates for standard OPCG JP booster boxes.
 * 24 packs, 6 cards/pack = 144 cards per box.
 *
 * Box patterns (JP booster):
 *   SEC box   (~33%): 1 SEC + 3 SR + rest
 *   PA 1 box  (~42%): 1 Parallel + 3 SR + rest
 *   PA 2 box  (~25%): 2 Parallel + 3 SR + rest
 *
 * SP cards are separate from parallels. ~1 SP per 4-6 boxes.
 */
const BOOSTER_RATES: Record<string, { avgPerBox: number; ratePerPack: number }> = {
  L:   { avgPerBox: 0,    ratePerPack: 0 },
  C:   { avgPerBox: 72,   ratePerPack: 3.0 },
  UC:  { avgPerBox: 24,   ratePerPack: 1.0 },
  R:   { avgPerBox: 24,   ratePerPack: 1.0 },
  SR:  { avgPerBox: 3,    ratePerPack: 0.125 },
  SEC: { avgPerBox: 0.33, ratePerPack: 0.014 },
  SP:  { avgPerBox: 0.2,  ratePerPack: 0.008 },
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

/**
 * Expected parallel art slots per box from the 3 box patterns:
 * SEC box (33%): 0 parallel slots
 * PA 1 box (42%): 1 parallel slot
 * PA 2 box (25%): 2 parallel slots
 * = 0.33*0 + 0.42*1 + 0.25*2 = 0.92 parallel slots per box on average
 */
const EXPECTED_PARALLEL_SLOTS_PER_BOX = 0.92;

async function main() {
  console.log("=== Seed Drop Rates ===\n");

  const sets = await prisma.cardSet.findMany({ orderBy: { code: "asc" } });
  console.log(`Found ${sets.length} sets.\n`);

  let totalEntries = 0;

  for (const set of sets) {
    let rates: Record<string, { avgPerBox: number; ratePerPack: number }>;
    let packsPerBox: number;
    let cardsPerPack: number;

    switch (set.type) {
      case "BOOSTER":
        rates = BOOSTER_RATES;
        packsPerBox = 24;
        cardsPerPack = 6;
        break;
      case "EXTRA_BOOSTER":
        rates = EXTRA_BOOSTER_RATES;
        packsPerBox = 24;
        cardsPerPack = 6;
        break;
      case "STARTER":
        rates = STARTER_RATES;
        packsPerBox = 1;
        cardsPerPack = 51;
        break;
      default:
        rates = BOOSTER_RATES;
        packsPerBox = 24;
        cardsPerPack = 6;
        break;
    }

    await prisma.cardSet.update({
      where: { id: set.id },
      data: { packsPerBox, cardsPerPack },
    });

    const rarityCounts = await prisma.card.groupBy({
      by: ["rarity", "isParallel"],
      where: { setId: set.id },
      _count: true,
    });

    const baseRarities = rarityCounts
      .filter((r) => !r.isParallel)
      .map((r) => r.rarity);

    const parallelCount = rarityCounts
      .filter((r) => r.isParallel)
      .reduce((sum, r) => sum + r._count, 0);

    let setEntries = 0;

    // Base rarity rates
    for (const [rarity, rate] of Object.entries(rates)) {
      if (!baseRarities.includes(rarity)) continue;

      await prisma.setDropRate.upsert({
        where: { setId_rarity: { setId: set.id, rarity } },
        update: { avgPerBox: rate.avgPerBox, ratePerPack: rate.ratePerPack },
        create: { setId: set.id, rarity, avgPerBox: rate.avgPerBox, ratePerPack: rate.ratePerPack },
      });
      setEntries++;
    }

    // Parallel rarity rates (P-C, P-UC, P-R, P-SR, P-SEC, P-L)
    // Each parallel card shares the ~0.92 parallel slots/box with ALL other parallels
    if (parallelCount > 0 && set.type !== "STARTER") {
      for (const rc of rarityCounts) {
        if (!rc.isParallel || !rc.rarity.startsWith("P-")) continue;

        const parallelAvg = EXPECTED_PARALLEL_SLOTS_PER_BOX;
        const parallelRatePerPack = parallelAvg / packsPerBox;

        await prisma.setDropRate.upsert({
          where: { setId_rarity: { setId: set.id, rarity: rc.rarity } },
          update: { avgPerBox: parallelAvg, ratePerPack: parallelRatePerPack },
          create: { setId: set.id, rarity: rc.rarity, avgPerBox: parallelAvg, ratePerPack: parallelRatePerPack },
        });
        setEntries++;
      }
    }

    console.log(`  [${set.code}] ${set.name}: ${setEntries} rate entries (${parallelCount} parallel cards in pool)`);
    totalEntries += setEntries;
  }

  console.log(`\n========================================`);
  console.log(`Done! ${totalEntries} total drop rate entries.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

import "dotenv/config";

const GH_BASE = "https://raw.githubusercontent.com/buhbbl/punk-records/main/english-asia";

async function main() {
  // First get packs to find OP13
  const packsRes = await fetch(`${GH_BASE}/packs.json`);
  const packs = await packsRes.json() as Record<string, { id: string }>;
  
  // Search all packs for OP13-118
  const packIds = Object.keys(packs);
  let variants: Array<{ id: string; name: string; rarity: string; category: string; colors: string[]; img_full_url: string }> = [];
  
  for (const packId of packIds) {
    const dataRes = await fetch(`${GH_BASE}/data/${packId}.json`);
    const cards = await dataRes.json() as typeof variants;
    const found = cards.filter(c => c.id.startsWith("OP13-118"));
    if (found.length > 0) {
      console.log("Found OP13-118 in pack:", packId);
      variants = found;
      break;
    }
  }
  
  console.log(`\n=== OP13-118 variants in punk-records (${variants.length}) ===`);
  for (const v of variants) {
    console.log(`  ${v.id}`);
    console.log(`    name: ${v.name}`);
    console.log(`    rarity: ${v.rarity}`);
    console.log(`    category: ${v.category}`);
    console.log(`    image: ${v.img_full_url}`);
    console.log();
  }

  // Also check OP01-001
  for (const packId of packIds) {
    const dataRes = await fetch(`${GH_BASE}/data/${packId}.json`);
    const cards = await dataRes.json() as typeof variants;
    const found = cards.filter(c => c.id.startsWith("OP01-001"));
    if (found.length > 0) {
      console.log(`\n=== OP01-001 variants in punk-records (${found.length}) ===`);
      for (const v of found) {
        console.log(`  ${v.id} | rarity: ${v.rarity} | image: ${v.img_full_url}`);
      }
      break;
    }
  }

  // Now check what Yuyu-tei gives us for OP13-118
  console.log("\n=== Checking Yuyu-tei scraper data for OP13 ===");
  const { PrismaClient } = await import("../src/generated/prisma/client");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  
  const dbVariants = await prisma.card.findMany({
    where: { baseCode: "OP13-118" },
    select: { 
      cardCode: true, baseCode: true, parallelIndex: true, 
      isParallel: true, nameJp: true, rarity: true, 
      latestPriceJpy: true, imageUrl: true 
    },
    orderBy: { latestPriceJpy: "asc" },
  });

  console.log(`\n=== DB cards for OP13-118 (${dbVariants.length}) ===`);
  for (const v of dbVariants) {
    console.log(`  ${v.cardCode}`);
    console.log(`    nameJp: ${v.nameJp}`);
    console.log(`    rarity: ${v.rarity}`);
    console.log(`    parallel: ${v.isParallel} | pIdx: ${v.parallelIndex}`);
    console.log(`    price: ¥${v.latestPriceJpy?.toLocaleString()}`);
    console.log();
  }

  await prisma["$disconnect"]();
}

main().catch(console.error);

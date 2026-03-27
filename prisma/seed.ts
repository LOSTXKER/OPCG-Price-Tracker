import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { SETS } from "../scripts/sets";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding card sets...");

  for (const set of SETS) {
    await prisma.cardSet.upsert({
      where: { code: set.code },
      update: { name: set.nameJp, nameEn: set.nameEn, type: set.type },
      create: { code: set.code, name: set.nameJp, nameEn: set.nameEn, type: set.type },
    });
    console.log(`  Upserted: ${set.code} - ${set.nameJp}`);
  }

  console.log(`Seeded ${SETS.length} card sets`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

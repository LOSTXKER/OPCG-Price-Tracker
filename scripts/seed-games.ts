import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL or DIRECT_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const opcg = await prisma.game.upsert({
    where: { slug: "opcg" },
    update: {},
    create: {
      slug: "opcg",
      name: "ONE PIECE CARD GAME",
      nameEn: "One Piece Card Game",
      isActive: true,
    },
  });
  console.log(`Game created/found: ${opcg.name} (id: ${opcg.id})`);

  const result = await prisma.cardSet.updateMany({
    where: { gameId: null },
    data: { gameId: opcg.id },
  });
  console.log(`Linked ${result.count} sets to OPCG game`);

  const pokemon = await prisma.game.upsert({
    where: { slug: "pokemon" },
    update: {},
    create: {
      slug: "pokemon",
      name: "ポケモンカードゲーム",
      nameEn: "Pokemon TCG",
      isActive: false,
    },
  });
  console.log(`Game placeholder created: ${pokemon.nameEn} (id: ${pokemon.id}, inactive)`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const SETS = [
  { code: "op01", name: "ROMANCE DAWN", nameEn: "Romance Dawn", type: "BOOSTER" as const },
  { code: "op02", name: "頂上決戦", nameEn: "Paramount War", type: "BOOSTER" as const },
  { code: "op03", name: "強大な敵", nameEn: "Pillars of Strength", type: "BOOSTER" as const },
  { code: "op04", name: "謀略の王国", nameEn: "Kingdoms of Intrigue", type: "BOOSTER" as const },
  { code: "op05", name: "新時代の主役", nameEn: "Awakening of the New Era", type: "BOOSTER" as const },
  { code: "op06", name: "双璧の覇者", nameEn: "Wings of the Captain", type: "BOOSTER" as const },
  { code: "op07", name: "500年後の未来", nameEn: "500 Years in the Future", type: "BOOSTER" as const },
  { code: "op08", name: "二つの伝説", nameEn: "Two Legends", type: "BOOSTER" as const },
  { code: "op09", name: "四皇の覇気", nameEn: "Emperors in the New World", type: "BOOSTER" as const },
  { code: "op10", name: "ロイヤルブラッドライン", nameEn: "Royal Bloodlines", type: "BOOSTER" as const },
  { code: "op11", name: "激闘の支配者", type: "BOOSTER" as const },
  { code: "op12", name: "烈風の支配者", type: "BOOSTER" as const },
  { code: "op13", name: "紡がれし絆", type: "BOOSTER" as const },
  { code: "op14", name: "Unknown", type: "BOOSTER" as const },
  { code: "op15", name: "神の島の冒険", type: "BOOSTER" as const },
  { code: "eb01", name: "Memorial Collection", nameEn: "Memorial Collection", type: "EXTRA_BOOSTER" as const },
  { code: "eb02", name: "Extra Booster 02", type: "EXTRA_BOOSTER" as const },
  { code: "eb03", name: "Extra Booster 03", type: "EXTRA_BOOSTER" as const },
  { code: "eb04", name: "Extra Booster 04", type: "EXTRA_BOOSTER" as const },
  { code: "st01", name: "麦わらの一味", nameEn: "Straw Hat Crew", type: "STARTER" as const },
  { code: "st02", name: "最悪の世代", nameEn: "Worst Generation", type: "STARTER" as const },
  { code: "st03", name: "王下七武海", nameEn: "The Seven Warlords of the Sea", type: "STARTER" as const },
  { code: "st04", name: "百獣海賊団", nameEn: "Animal Kingdom Pirates", type: "STARTER" as const },
  { code: "st05", name: "ONE PIECE FILM edition", type: "STARTER" as const },
  { code: "st06", name: "海軍絶対正義", type: "STARTER" as const },
  { code: "st07", name: "BIG MOMの海賊団", type: "STARTER" as const },
  { code: "st08", name: "Side-モンキー・D・ルフィ", type: "STARTER" as const },
  { code: "st09", name: "Side-ヤマト", type: "STARTER" as const },
  { code: "st10", name: "ウルトラデッキ 三兄弟の絆", type: "STARTER" as const },
  { code: "st11", name: "ウタ", type: "STARTER" as const },
  { code: "st12", name: "ゾロ&サンジ", type: "STARTER" as const },
  { code: "st13", name: "ウルトラデッキ 三船長集結", type: "STARTER" as const },
  { code: "st14", name: "3D2Y", type: "STARTER" as const },
  { code: "st15", name: "RED Edward.Newgate", type: "STARTER" as const },
  { code: "st16", name: "GREEN Uta", type: "STARTER" as const },
  { code: "st17", name: "BLUE Donquixote Doflamingo", type: "STARTER" as const },
  { code: "st18", name: "PURPLE Monkey.D.Luffy", type: "STARTER" as const },
  { code: "st19", name: "BLACK Smoker", type: "STARTER" as const },
  { code: "st20", name: "YELLOW Charlotte Katakuri", type: "STARTER" as const },
  { code: "st21", name: "Starter Deck 21", type: "STARTER" as const },
  { code: "prb01", name: "Premium Booster 01", type: "PROMO" as const },
];

async function main() {
  console.log("Seeding card sets...");

  for (const set of SETS) {
    await prisma.cardSet.upsert({
      where: { code: set.code },
      update: { name: set.name, nameEn: set.nameEn, type: set.type },
      create: set,
    });
    console.log(`  Upserted: ${set.code} - ${set.name}`);
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

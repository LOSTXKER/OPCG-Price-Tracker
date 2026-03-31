import { prisma } from "./_db";

const ACHIEVEMENTS = [
  {
    code: "portfolio_100",
    name: "コレクター100",
    nameEn: "Collector 100",
    nameTh: "นักสะสม 100",
    description: "Add 100 cards to your portfolio",
    criteria: { type: "portfolio_count", target: 100 },
    honeyReward: 100,
  },
  {
    code: "streak_7",
    name: "7日連続チェックイン",
    nameEn: "7-Day Streak",
    nameTh: "เช็คอิน 7 วัน",
    description: "Check in for 7 consecutive days",
    criteria: { type: "checkin_streak", target: 7 },
    honeyReward: 50,
  },
  {
    code: "streak_30",
    name: "30日連続チェックイン",
    nameEn: "30-Day Streak",
    nameTh: "เช็คอิน 30 วัน",
    description: "Check in for 30 consecutive days",
    criteria: { type: "checkin_streak", target: 30 },
    honeyReward: 200,
  },
  {
    code: "first_sell",
    name: "初出品",
    nameEn: "First Sale",
    nameTh: "ขายครั้งแรก",
    description: "Complete your first marketplace sale",
    criteria: { type: "first_sell", target: 1 },
    honeyReward: 30,
  },
  {
    code: "first_review",
    name: "初レビュー",
    nameEn: "First Review",
    nameTh: "รีวิวครั้งแรก",
    description: "Write your first review",
    criteria: { type: "first_review", target: 1 },
    honeyReward: 20,
  },
  {
    code: "collector_500",
    name: "コレクター500",
    nameEn: "Collector 500",
    nameTh: "นักสะสม 500",
    description: "Add 500 cards to your portfolio",
    criteria: { type: "portfolio_count", target: 500 },
    honeyReward: 300,
  },
  {
    code: "prediction_5",
    name: "予想5回的中",
    nameEn: "5 Correct Predictions",
    nameTh: "ทายถูก 5 ครั้ง",
    description: "Get 5 price predictions correct",
    criteria: { type: "correct_predictions", target: 5 },
    honeyReward: 100,
  },
];

async function main() {
  console.log("Seeding achievements...");

  for (const ach of ACHIEVEMENTS) {
    const existing = await prisma.achievement.findUnique({ where: { code: ach.code } });
    if (existing) {
      console.log(`  [skip] "${ach.nameEn}" already exists`);
      continue;
    }

    const created = await prisma.achievement.create({
      data: {
        code: ach.code,
        name: ach.name,
        nameEn: ach.nameEn,
        nameTh: ach.nameTh,
        description: ach.description,
        criteria: ach.criteria as object,
        honeyReward: ach.honeyReward,
      },
    });
    console.log(`  [created] "${ach.nameEn}" (id: ${created.id})`);
  }

  console.log("Done!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

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
  {
    code: "streak_90",
    name: "90日連続チェックイン",
    nameEn: "90-Day Streak",
    nameTh: "เช็คอิน 90 วัน",
    description: "Check in for 90 consecutive days",
    criteria: { type: "checkin_streak", target: 90 },
    honeyReward: 500,
  },
  {
    code: "streak_365",
    name: "365日連続チェックイン",
    nameEn: "365-Day Streak",
    nameTh: "เช็คอิน 365 วัน",
    description: "Check in for 365 consecutive days",
    criteria: { type: "checkin_streak", target: 365 },
    honeyReward: 2000,
  },
  {
    code: "referral_5",
    name: "紹介5人",
    nameEn: "Refer 5 Users",
    nameTh: "ชวนเพื่อน 5 คน",
    description: "Successfully refer 5 new users",
    criteria: { type: "referral_count", target: 5 },
    honeyReward: 300,
  },
  {
    code: "referral_20",
    name: "紹介20人",
    nameEn: "Refer 20 Users",
    nameTh: "ชวนเพื่อน 20 คน",
    description: "Successfully refer 20 new users",
    criteria: { type: "referral_count", target: 20 },
    honeyReward: 1000,
  },
  {
    code: "portfolio_1000",
    name: "コレクター1000",
    nameEn: "Collector 1000",
    nameTh: "นักสะสม 1000",
    description: "Add 1000 cards to your portfolio",
    criteria: { type: "portfolio_count", target: 1000 },
    honeyReward: 500,
  },
  {
    code: "trades_10",
    name: "取引10回",
    nameEn: "10 Marketplace Sales",
    nameTh: "ขาย 10 ครั้ง",
    description: "Complete 10 marketplace sales",
    criteria: { type: "trades_count", target: 10 },
    honeyReward: 200,
  },
  {
    code: "honey_lifetime_10000",
    name: "ハニー10000獲得",
    nameEn: "10,000 Lifetime Honey",
    nameTh: "สะสม Honey 10,000",
    description: "Earn a total of 10,000 Honey points",
    criteria: { type: "honey_lifetime", target: 10000 },
    honeyReward: 500,
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

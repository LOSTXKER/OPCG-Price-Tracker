import { prisma } from "./_db";

/**
 * Achievement seeds — Honey rebalance v2.
 *
 * Five families with progressive tiers; rewards are scaled to the v2
 * earning curve (see `doc/honey-economy-rebalance.md` §5). Late-tier
 * grinds (e.g. 1,000 portfolio, 365-day streak, 50 referrals) are the
 * tentpole rewards that fund roughly two free 30-day Pro Passes over
 * a player's full lifetime.
 *
 * Reward bands:
 *   - First-time / onboarding milestones:    20–100 honey
 *   - Mid-tier engagement:                   100–500 honey
 *   - Late-tier grind:                       1,000–5,000 honey
 *
 * Criteria types listed below must all exist in:
 *   - `AchievementCriteriaSchema` (`src/lib/honey/schemas.ts`)
 *   - `batchFetchStats` (`src/lib/honey/achievements.ts`)
 *
 * Re-running this script will UPDATE name / description / criteria / reward /
 * isActive on existing rows (matched by `code`). Codes listed under
 * `DEPRECATED_CODES` are flipped to `isActive=false` (existing claims keep
 * their reward; the achievement just stops appearing for new users).
 */
const ACHIEVEMENTS = [
  // ── Collector — portfolio depth ────────────────────────────────
  {
    code: "portfolio_10",
    name: "コレクター10",
    nameEn: "Collector 10",
    nameTh: "นักสะสม 10",
    description: "Add 10 cards to your portfolio",
    criteria: { type: "portfolio_count", target: 10 },
    honeyReward: 30,
  },
  {
    code: "portfolio_50",
    name: "コレクター50",
    nameEn: "Collector 50",
    nameTh: "นักสะสม 50",
    description: "Add 50 cards to your portfolio",
    criteria: { type: "portfolio_count", target: 50 },
    honeyReward: 80,
  },
  {
    code: "portfolio_100",
    name: "コレクター100",
    nameEn: "Collector 100",
    nameTh: "นักสะสม 100",
    description: "Add 100 cards to your portfolio",
    criteria: { type: "portfolio_count", target: 100 },
    honeyReward: 200,
  },
  {
    code: "collector_500",
    name: "コレクター500",
    nameEn: "Collector 500",
    nameTh: "นักสะสม 500",
    description: "Add 500 cards to your portfolio",
    criteria: { type: "portfolio_count", target: 500 },
    honeyReward: 500,
  },
  {
    code: "portfolio_1000",
    name: "コレクター1000",
    nameEn: "Collector 1000",
    nameTh: "นักสะสม 1000",
    description: "Add 1000 cards to your portfolio",
    criteria: { type: "portfolio_count", target: 1000 },
    honeyReward: 1500,
  },

  // ── Streaker — daily check-in streak ───────────────────────────
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
    honeyReward: 250,
  },
  {
    code: "streak_90",
    name: "90日連続チェックイン",
    nameEn: "90-Day Streak",
    nameTh: "เช็คอิน 90 วัน",
    description: "Check in for 90 consecutive days",
    criteria: { type: "checkin_streak", target: 90 },
    honeyReward: 750,
  },
  {
    code: "streak_365",
    name: "365日連続チェックイン",
    nameEn: "365-Day Streak",
    nameTh: "เช็คอิน 365 วัน",
    description: "Check in for 365 consecutive days",
    criteria: { type: "checkin_streak", target: 365 },
    honeyReward: 3000,
  },

  // ── Trader — marketplace seller ────────────────────────────────
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
    code: "trades_10",
    name: "取引10回",
    nameEn: "10 Marketplace Sales",
    nameTh: "ขาย 10 ครั้ง",
    description: "Complete 10 marketplace sales",
    criteria: { type: "trades_count", target: 10 },
    honeyReward: 250,
  },
  {
    code: "trades_50",
    name: "取引50回",
    nameEn: "50 Marketplace Sales",
    nameTh: "ขาย 50 ครั้ง",
    description: "Complete 50 marketplace sales",
    criteria: { type: "trades_count", target: 50 },
    honeyReward: 800,
  },
  {
    code: "trades_200",
    name: "取引200回",
    nameEn: "200 Marketplace Sales",
    nameTh: "ขาย 200 ครั้ง",
    description: "Complete 200 marketplace sales",
    criteria: { type: "trades_count", target: 200 },
    honeyReward: 2500,
  },

  // ── Buyer — marketplace buyer ──────────────────────────────────
  {
    code: "first_buy",
    name: "初購入",
    nameEn: "First Purchase",
    nameTh: "ซื้อครั้งแรก",
    description: "Complete your first marketplace purchase",
    criteria: { type: "order_buy_count", target: 1 },
    honeyReward: 30,
  },
  {
    code: "buyer_10",
    name: "購入10回",
    nameEn: "10 Marketplace Purchases",
    nameTh: "ซื้อ 10 ครั้ง",
    description: "Complete 10 marketplace purchases",
    criteria: { type: "order_buy_count", target: 10 },
    honeyReward: 250,
  },
  {
    code: "buyer_50",
    name: "購入50回",
    nameEn: "50 Marketplace Purchases",
    nameTh: "ซื้อ 50 ครั้ง",
    description: "Complete 50 marketplace purchases",
    criteria: { type: "order_buy_count", target: 50 },
    honeyReward: 800,
  },
  {
    code: "buyer_200",
    name: "購入200回",
    nameEn: "200 Marketplace Purchases",
    nameTh: "ซื้อ 200 ครั้ง",
    description: "Complete 200 marketplace purchases",
    criteria: { type: "order_buy_count", target: 200 },
    honeyReward: 2500,
  },

  // ── Reviewer — write reviews ───────────────────────────────────
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
    code: "review_5",
    name: "レビュー5回",
    nameEn: "5 Reviews",
    nameTh: "รีวิว 5 ครั้ง",
    description: "Write 5 reviews",
    criteria: { type: "review_count", target: 5 },
    honeyReward: 80,
  },
  {
    code: "review_20",
    name: "レビュー20回",
    nameEn: "20 Reviews",
    nameTh: "รีวิว 20 ครั้ง",
    description: "Write 20 reviews",
    criteria: { type: "review_count", target: 20 },
    honeyReward: 300,
  },
  {
    code: "review_100",
    name: "レビュー100回",
    nameEn: "100 Reviews",
    nameTh: "รีวิว 100 ครั้ง",
    description: "Write 100 reviews",
    criteria: { type: "review_count", target: 100 },
    honeyReward: 1000,
  },

  // ── Predictor — price predictions ──────────────────────────────
  {
    code: "predict_5_attempts",
    name: "予想5回挑戦",
    nameEn: "5 Predictions",
    nameTh: "ทาย 5 ครั้ง",
    description: "Make 5 price predictions",
    criteria: { type: "prediction_count", target: 5 },
    honeyReward: 30,
  },
  {
    code: "predict_25_attempts",
    name: "予想25回挑戦",
    nameEn: "25 Predictions",
    nameTh: "ทาย 25 ครั้ง",
    description: "Make 25 price predictions",
    criteria: { type: "prediction_count", target: 25 },
    honeyReward: 150,
  },
  {
    code: "predict_100_attempts",
    name: "予想100回挑戦",
    nameEn: "100 Predictions",
    nameTh: "ทาย 100 ครั้ง",
    description: "Make 100 price predictions",
    criteria: { type: "prediction_count", target: 100 },
    honeyReward: 500,
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
    code: "prediction_25",
    name: "予想25回的中",
    nameEn: "25 Correct Predictions",
    nameTh: "ทายถูก 25 ครั้ง",
    description: "Get 25 price predictions correct",
    criteria: { type: "correct_predictions", target: 25 },
    honeyReward: 500,
  },
  {
    code: "prediction_100",
    name: "予想100回的中",
    nameEn: "100 Correct Predictions",
    nameTh: "ทายถูก 100 ครั้ง",
    description: "Get 100 price predictions correct",
    criteria: { type: "correct_predictions", target: 100 },
    honeyReward: 2000,
  },

  // ── Connector — referrals ──────────────────────────────────────
  {
    code: "referral_1",
    name: "紹介1人",
    nameEn: "First Referral",
    nameTh: "ชวนเพื่อนคนแรก",
    description: "Successfully refer your first user",
    criteria: { type: "referral_count", target: 1 },
    honeyReward: 100,
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
    code: "referral_10",
    name: "紹介10人",
    nameEn: "Refer 10 Users",
    nameTh: "ชวนเพื่อน 10 คน",
    description: "Successfully refer 10 new users",
    criteria: { type: "referral_count", target: 10 },
    honeyReward: 600,
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
    code: "referral_50",
    name: "紹介50人",
    nameEn: "Refer 50 Users",
    nameTh: "ชวนเพื่อน 50 คน",
    description: "Successfully refer 50 new users",
    criteria: { type: "referral_count", target: 50 },
    honeyReward: 3000,
  },

  // ── Watchlister — track cards ──────────────────────────────────
  {
    code: "watchlist_10",
    name: "ウォッチリスト10",
    nameEn: "Watchlist 10",
    nameTh: "วอชลิสต์ 10 ใบ",
    description: "Add 10 cards to your watchlist",
    criteria: { type: "watchlist_count", target: 10 },
    honeyReward: 50,
  },
  {
    code: "watchlist_50",
    name: "ウォッチリスト50",
    nameEn: "Watchlist 50",
    nameTh: "วอชลิสต์ 50 ใบ",
    description: "Add 50 cards to your watchlist",
    criteria: { type: "watchlist_count", target: 50 },
    honeyReward: 150,
  },
  {
    code: "watchlist_200",
    name: "ウォッチリスト200",
    nameEn: "Watchlist 200",
    nameTh: "วอชลิสต์ 200 ใบ",
    description: "Add 200 cards to your watchlist",
    criteria: { type: "watchlist_count", target: 200 },
    honeyReward: 500,
  },

  // ── Deck Master — build & share decks ──────────────────────────
  {
    code: "deck_3",
    name: "デッキ3個",
    nameEn: "3 Decks",
    nameTh: "สร้างเด็ค 3 ชุด",
    description: "Build 3 decks",
    criteria: { type: "deck_count", target: 3 },
    honeyReward: 80,
  },
  {
    code: "deck_share_1",
    name: "初公開デッキ",
    nameEn: "First Public Deck",
    nameTh: "เปิดเด็คสาธารณะครั้งแรก",
    description: "Make your first deck public",
    criteria: { type: "deck_share_count", target: 1 },
    honeyReward: 50,
  },
  {
    code: "deck_share_10",
    name: "公開デッキ10個",
    nameEn: "10 Public Decks",
    nameTh: "แชร์เด็ค 10 ชุด",
    description: "Make 10 decks public",
    criteria: { type: "deck_share_count", target: 10 },
    honeyReward: 400,
  },
  {
    code: "deck_share_50",
    name: "公開デッキ50個",
    nameEn: "50 Public Decks",
    nameTh: "แชร์เด็ค 50 ชุด",
    description: "Make 50 decks public",
    criteria: { type: "deck_share_count", target: 50 },
    honeyReward: 1200,
  },

  // ── Helper — community contributions ───────────────────────────
  {
    code: "community_helper_10",
    name: "コミュニティ協力者10",
    nameEn: "Community Helper 10",
    nameTh: "ผู้ช่วยชุมชน 10",
    description: "Submit 10 community prices",
    criteria: { type: "community_price_count", target: 10 },
    honeyReward: 150,
  },
  {
    code: "community_helper_50",
    name: "コミュニティ協力者50",
    nameEn: "Community Helper 50",
    nameTh: "ผู้ช่วยชุมชน 50",
    description: "Submit 50 community prices",
    criteria: { type: "community_price_count", target: 50 },
    honeyReward: 500,
  },
  {
    code: "community_helper_200",
    name: "コミュニティ協力者200",
    nameEn: "Community Helper 200",
    nameTh: "ผู้ช่วยชุมชน 200",
    description: "Submit 200 community prices",
    criteria: { type: "community_price_count", target: 200 },
    honeyReward: 1500,
  },

  // ── Special — perfect days & raffle ────────────────────────────
  {
    code: "perfect_week",
    name: "パーフェクト1週間",
    nameEn: "Perfect Week",
    nameTh: "ครบทุกภารกิจ 7 วัน",
    description: "Achieve a perfect day on 7 different days",
    criteria: { type: "perfect_day_count", target: 7 },
    honeyReward: 200,
  },
  {
    code: "perfect_month",
    name: "パーフェクト30日",
    nameEn: "Perfect Month",
    nameTh: "ครบทุกภารกิจ 30 วัน",
    description: "Achieve a perfect day on 30 different days",
    criteria: { type: "perfect_day_count", target: 30 },
    honeyReward: 1500,
  },
  {
    code: "raffle_first_win",
    name: "初当選",
    nameEn: "First Raffle Win",
    nameTh: "ถูกรางวัลครั้งแรก",
    description: "Win your first monthly raffle",
    criteria: { type: "raffle_win_count", target: 1 },
    honeyReward: 200,
  },
  {
    code: "raffle_3_wins",
    name: "3回当選",
    nameEn: "3-Time Raffle Winner",
    nameTh: "ถูกรางวัล 3 ครั้ง",
    description: "Win the monthly raffle 3 times in total",
    criteria: { type: "raffle_win_count", target: 3 },
    honeyReward: 1000,
  },

  // ── Honey Royalty — lifetime earnings ──────────────────────────
  {
    code: "honey_lifetime_5000",
    name: "ハニー5000獲得",
    nameEn: "5,000 Lifetime Honey",
    nameTh: "สะสม Honey 5,000",
    description: "Earn a total of 5,000 Honey points",
    criteria: { type: "honey_lifetime", target: 5000 },
    honeyReward: 500,
  },
  {
    code: "honey_lifetime_15000",
    name: "ハニー15000獲得",
    nameEn: "15,000 Lifetime Honey",
    nameTh: "สะสม Honey 15,000",
    description: "Earn a total of 15,000 Honey points",
    criteria: { type: "honey_lifetime", target: 15000 },
    honeyReward: 1500,
  },
  {
    code: "honey_lifetime_50000",
    name: "ハニー50000獲得",
    nameEn: "50,000 Lifetime Honey",
    nameTh: "สะสม Honey 50,000",
    description: "Earn a total of 50,000 Honey points",
    criteria: { type: "honey_lifetime", target: 50000 },
    honeyReward: 5000,
  },
];

/**
 * Codes from previous seeds that are no longer part of the v2 ladder.
 * Existing user achievements with these codes keep their honey reward;
 * the rows are just hidden from new users by setting `isActive=false`.
 */
const DEPRECATED_CODES = [
  "honey_lifetime_10000",
  "honey_lifetime_25000",
];

async function main() {
  console.log("Seeding achievements...");

  let created = 0;
  let updated = 0;

  for (const ach of ACHIEVEMENTS) {
    const result = await prisma.achievement.upsert({
      where: { code: ach.code },
      create: {
        code: ach.code,
        name: ach.name,
        nameEn: ach.nameEn,
        nameTh: ach.nameTh,
        description: ach.description,
        criteria: ach.criteria as object,
        honeyReward: ach.honeyReward,
        isActive: true,
      },
      update: {
        name: ach.name,
        nameEn: ach.nameEn,
        nameTh: ach.nameTh,
        description: ach.description,
        criteria: ach.criteria as object,
        honeyReward: ach.honeyReward,
        isActive: true,
      },
    });

    const wasJustCreated = Math.abs(Date.now() - result.createdAt.getTime()) < 5_000;
    if (wasJustCreated) {
      created++;
      console.log(`  [created] "${ach.nameEn}" → ${ach.honeyReward} honey`);
    } else {
      updated++;
      console.log(`  [updated] "${ach.nameEn}" → ${ach.honeyReward} honey`);
    }
  }

  // Deactivate codes that have been replaced. Existing user-claimed rows
  // (UserAchievement) are unaffected — they reference the achievement by id
  // and keep their already-paid Honey.
  let deactivated = 0;
  for (const code of DEPRECATED_CODES) {
    const result = await prisma.achievement.updateMany({
      where: { code, isActive: true },
      data: { isActive: false },
    });
    if (result.count > 0) {
      deactivated += result.count;
      console.log(`  [retired] ${code}`);
    }
  }

  console.log(
    `\nDone! Created ${created}, updated ${updated}, retired ${deactivated}.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

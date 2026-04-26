/**
 * Seed script: migrate hardcoded mission definitions into MissionTemplate,
 * MissionScheduleRule, and MissionBonusRule tables.
 *
 * Run with: npx tsx scripts/seed-missions.ts
 *
 * Idempotent — uses upsert on template code.
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

type TemplateSeed = {
  code: string;
  name: string;
  nameEn: string;
  nameTh: string;
  icon: string;
  trackType: "AUTO_PATH" | "MANUAL" | "ACTION_COUNT";
  conditions: object;
  rewards: object;
  target: number;
  sortOrder: number;
};

type ScheduleSeed = {
  templateCode: string;
  slotType: "CORE" | "DAY_OF_WEEK" | "RANDOM_POOL" | "FIXED_DATE" | "SEQUENTIAL";
  dayOfWeek?: number;
  sortOrder: number;
};

const CORE_TEMPLATES: TemplateSeed[] = [
  {
    code: "check_price",
    name: "ดูราคาการ์ด",
    nameEn: "Check a price",
    nameTh: "ดูราคาการ์ด",
    icon: "Search",
    trackType: "AUTO_PATH",
    conditions: { type: "visit_path", paths: ["/cards/*"] },
    rewards: { honey: 10, tickets: 0 },
    target: 1,
    sortOrder: 0,
  },
  {
    code: "browse_trending",
    name: "ดูหน้าเทรนด์",
    nameEn: "Browse trending",
    nameTh: "ดูหน้าเทรนด์",
    icon: "TrendingUp",
    trackType: "AUTO_PATH",
    conditions: { type: "visit_path", paths: ["/trending"] },
    rewards: { honey: 10, tickets: 0 },
    target: 1,
    sortOrder: 1,
  },
  {
    code: "visit_marketplace",
    name: "เข้าชมตลาด",
    nameEn: "Visit marketplace",
    nameTh: "เข้าชมตลาด",
    icon: "ShoppingBag",
    trackType: "AUTO_PATH",
    conditions: { type: "visit_path", paths: ["/marketplace"] },
    rewards: { honey: 10, tickets: 0 },
    target: 1,
    sortOrder: 2,
  },
];

const ROTATING_TEMPLATES: TemplateSeed[] = [
  {
    code: "check_portfolio",
    name: "เช็คพอร์ต",
    nameEn: "Check portfolio",
    nameTh: "เช็คพอร์ต",
    icon: "Wallet",
    trackType: "AUTO_PATH",
    conditions: { type: "visit_path", paths: ["/portfolio"] },
    rewards: { honey: 10, tickets: 0 },
    target: 1,
    sortOrder: 10,
  },
  {
    code: "explore_set",
    name: "สำรวจเซ็ต",
    nameEn: "Explore a set",
    nameTh: "สำรวจเซ็ต",
    icon: "Layers",
    trackType: "AUTO_PATH",
    conditions: { type: "visit_path", paths: ["/sets/*"] },
    rewards: { honey: 10, tickets: 0 },
    target: 1,
    sortOrder: 10,
  },
  {
    code: "share_card",
    name: "แชร์การ์ด",
    nameEn: "Share a card",
    nameTh: "แชร์การ์ด",
    icon: "Share2",
    trackType: "MANUAL",
    conditions: { type: "manual_confirm" },
    rewards: { honey: 10, tickets: 0 },
    target: 1,
    sortOrder: 10,
  },
  {
    code: "visit_overview",
    name: "ดูภาพรวมตลาด",
    nameEn: "Visit market overview",
    nameTh: "ดูภาพรวมตลาด",
    icon: "BarChart3",
    trackType: "AUTO_PATH",
    conditions: { type: "visit_path", paths: ["/market-overview"] },
    rewards: { honey: 10, tickets: 0 },
    target: 1,
    sortOrder: 10,
  },
  {
    code: "read_blog",
    name: "อ่านบล็อก",
    nameEn: "Read a blog post",
    nameTh: "อ่านบล็อก",
    icon: "BookOpen",
    trackType: "AUTO_PATH",
    conditions: { type: "visit_path", paths: ["/blog"] },
    rewards: { honey: 10, tickets: 0 },
    target: 1,
    sortOrder: 10,
  },
  {
    code: "share_site",
    name: "แชร์เว็บไซต์",
    nameEn: "Share the site",
    nameTh: "แชร์เว็บไซต์",
    icon: "Share2",
    trackType: "MANUAL",
    conditions: { type: "manual_confirm" },
    rewards: { honey: 10, tickets: 0 },
    target: 1,
    sortOrder: 10,
  },
  {
    code: "check_watchlist",
    name: "เช็คลิสต์ติดตาม",
    nameEn: "Check watchlist",
    nameTh: "เช็คลิสต์ติดตาม",
    icon: "Eye",
    trackType: "AUTO_PATH",
    conditions: { type: "visit_path", paths: ["/watchlist"] },
    rewards: { honey: 10, tickets: 0 },
    target: 1,
    sortOrder: 10,
  },
];

const CORE_SCHEDULE: ScheduleSeed[] = CORE_TEMPLATES.map((t) => ({
  templateCode: t.code,
  slotType: "CORE" as const,
  sortOrder: t.sortOrder,
}));

const ROTATING_SCHEDULE: ScheduleSeed[] = [
  { templateCode: "check_portfolio", slotType: "DAY_OF_WEEK", dayOfWeek: 0, sortOrder: 10 },
  { templateCode: "explore_set", slotType: "DAY_OF_WEEK", dayOfWeek: 1, sortOrder: 10 },
  { templateCode: "share_card", slotType: "DAY_OF_WEEK", dayOfWeek: 2, sortOrder: 10 },
  { templateCode: "visit_overview", slotType: "DAY_OF_WEEK", dayOfWeek: 3, sortOrder: 10 },
  { templateCode: "read_blog", slotType: "DAY_OF_WEEK", dayOfWeek: 4, sortOrder: 10 },
  { templateCode: "share_site", slotType: "DAY_OF_WEEK", dayOfWeek: 5, sortOrder: 10 },
  { templateCode: "check_watchlist", slotType: "DAY_OF_WEEK", dayOfWeek: 6, sortOrder: 10 },
];

async function main() {
  console.log("Seeding mission templates...");

  const allTemplates = [...CORE_TEMPLATES, ...ROTATING_TEMPLATES];
  const templateMap = new Map<string, number>();

  for (const t of allTemplates) {
    const template = await prisma.missionTemplate.upsert({
      where: { code: t.code },
      update: {
        name: t.name,
        nameEn: t.nameEn,
        nameTh: t.nameTh,
        icon: t.icon,
        trackType: t.trackType,
        conditions: t.conditions,
        rewards: t.rewards,
        target: t.target,
        sortOrder: t.sortOrder,
      },
      create: {
        code: t.code,
        name: t.name,
        nameEn: t.nameEn,
        nameTh: t.nameTh,
        icon: t.icon,
        category: "DAILY",
        trackType: t.trackType,
        conditions: t.conditions,
        rewards: t.rewards,
        target: t.target,
        sortOrder: t.sortOrder,
      },
    });
    templateMap.set(t.code, template.id);
    console.log(`  Upserted template: ${t.code} (id=${template.id})`);
  }

  console.log("\nSeeding schedule rules...");

  const allSchedule = [...CORE_SCHEDULE, ...ROTATING_SCHEDULE];
  for (const s of allSchedule) {
    const templateId = templateMap.get(s.templateCode);
    if (!templateId) {
      console.warn(`  Template not found: ${s.templateCode}`);
      continue;
    }

    const existing = await prisma.missionScheduleRule.findFirst({
      where: { templateId, slotType: s.slotType, dayOfWeek: s.dayOfWeek ?? null },
    });

    if (existing) {
      console.log(`  Schedule rule already exists for ${s.templateCode} (${s.slotType} day=${s.dayOfWeek ?? "all"})`);
      continue;
    }

    await prisma.missionScheduleRule.create({
      data: {
        templateId,
        slotType: s.slotType,
        dayOfWeek: s.dayOfWeek ?? null,
        sortOrder: s.sortOrder,
      },
    });
    console.log(`  Created schedule: ${s.templateCode} → ${s.slotType} day=${s.dayOfWeek ?? "all"}`);
  }

  console.log("\nSeeding bonus rules...");

  const perfectDayExists = await prisma.missionBonusRule.findFirst({
    where: { category: "DAILY", requirement: "ALL_COMPLETE" },
  });
  if (!perfectDayExists) {
    await prisma.missionBonusRule.create({
      data: {
        name: "Perfect Day Bonus",
        nameEn: "Perfect Day Bonus",
        nameTh: "โบนัสทำครบ",
        category: "DAILY",
        requirement: "ALL_COMPLETE",
        requirementValue: 1,
        rewards: { honey: 20, tickets: 0 },
        sortOrder: 0,
      },
    });
    console.log("  Created: Perfect Day Bonus (ALL_COMPLETE → 20 honey)");
  } else {
    console.log("  Perfect Day Bonus already exists");
  }

  const weeklyExists = await prisma.missionBonusRule.findFirst({
    where: { category: "DAILY", requirement: "STREAK_DAYS" },
  });
  if (!weeklyExists) {
    await prisma.missionBonusRule.create({
      data: {
        name: "Weekly Streak Bonus",
        nameEn: "Weekly Streak Bonus",
        nameTh: "โบนัสทำครบ 7 วัน",
        category: "DAILY",
        requirement: "STREAK_DAYS",
        requirementValue: 7,
        rewards: { honey: 100, tickets: 0 },
        sortOrder: 1,
      },
    });
    console.log("  Created: Weekly Streak Bonus (STREAK_DAYS=7 → 100 honey)");
  } else {
    console.log("  Weekly Streak Bonus already exists");
  }

  console.log("\nDone! Seeded mission system.");
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

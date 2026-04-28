import { prisma } from "./_db";
import type { ShopItemType } from "../src/generated/prisma/client";

/**
 * Honey Shop catalog — Honey rebalance v2.
 *
 * Three progression tiers + a Mega Pass capstone, all gated by lifetime
 * Honey level (`requiredLevel`, see `src/lib/honey/levels.ts`):
 *   - Tier S (50–500)   — Newbie+        — daily affordable cosmetics & utilities
 *   - Tier M (500–2,000)— Bronze+ (lvl 1)— weekly utility bundles
 *   - Tier L (2,500–15k)— Silver+ (lvl 2)— premium time-limited Pro / Pro+ access
 *   - Mega Pass (20k)   — Gold+   (lvl 3)— 90-day Pro + 3 tickets + flame frame
 *
 * The seed is idempotent: re-running won't duplicate rows, and existing
 * items get their cost / description / requiredLevel / type-specific value
 * blob updated in place.
 */
type Item = {
  /** Stable Japanese name; used as the upsert key. Don't rename casually. */
  name: string;
  nameEn: string;
  nameTh: string;
  description: string;
  cost: number;
  type: ShopItemType;
  requiredLevel?: number;
  value: Record<string, unknown>;
};

const ITEMS: Item[] = [
  // ── Tier S ─ Daily affordable cosmetics & utilities (50–500) ─────────
  {
    name: "ブロンズフレーム",
    nameEn: "Bronze Profile Frame",
    nameTh: "กรอบโปรไฟล์ทองแดง",
    description: "An entry-level bronze frame for your profile picture",
    cost: 50,
    type: "PROFILE_FRAME",
    requiredLevel: 0,
    value: { frameId: "bronze" },
  },
  {
    name: "ゴールドフレーム",
    nameEn: "Gold Profile Frame",
    nameTh: "กรอบโปรไฟล์สีทอง",
    description: "A shiny gold frame for your profile picture",
    cost: 100,
    type: "PROFILE_FRAME",
    requiredLevel: 0,
    value: { frameId: "gold" },
  },
  {
    name: "ダイヤモンドフレーム",
    nameEn: "Diamond Profile Frame",
    nameTh: "กรอบโปรไฟล์เพชร",
    description: "A premium diamond frame for your profile picture",
    cost: 200,
    type: "PROFILE_FRAME",
    requiredLevel: 0,
    value: { frameId: "diamond" },
  },
  {
    name: "炎フレーム",
    nameEn: "Flame Profile Frame",
    nameTh: "กรอบโปรไฟล์ไฟ",
    description: "A fiery frame for your profile picture",
    cost: 300,
    type: "PROFILE_FRAME",
    requiredLevel: 0,
    value: { frameId: "flame" },
  },
  {
    name: "Kuma バッジ",
    nameEn: "Kuma Profile Badge",
    nameTh: "แบดจ์ Kuma บนโปรไฟล์",
    description: "Exclusive Kuma badge on your profile",
    cost: 200,
    type: "BADGE",
    requiredLevel: 0,
    value: { imageUrl: null },
  },
  {
    name: "リスティングブースト 24時間",
    nameEn: "Listing Boost 24h",
    nameTh: "Boost ประกาศ 24 ชม.",
    description: "Boost your latest active listing to the top for 24 hours",
    cost: 120,
    type: "CUSTOM",
    requiredLevel: 0,
    value: { reward: "listing_boost", hours: 24 },
  },
  {
    name: "CSV出力パス",
    nameEn: "CSV Export Pass",
    nameTh: "สิทธิ์ส่งออก CSV",
    description: "Export your portfolio to CSV once",
    cost: 150,
    type: "CSV_EXPORT_PASS",
    requiredLevel: 0,
    value: {},
  },
  {
    name: "アラート枠追加 +1",
    nameEn: "Price Alert +1 Slot",
    nameTh: "ช่องแจ้งเตือนราคา +1",
    description: "Add one extra price alert slot permanently",
    cost: 180,
    type: "PRICE_ALERT_SLOT",
    requiredLevel: 0,
    value: {},
  },
  {
    name: "ウォッチリスト +5",
    nameEn: "Watchlist +5 Slots",
    nameTh: "เพิ่มช่องวอชลิสต์ +5",
    description: "Add 5 extra watchlist slots permanently",
    cost: 250,
    type: "CUSTOM",
    requiredLevel: 0,
    value: { reward: "watchlist_slots", quantity: 5 },
  },

  // ── Tier M ─ Weekly utility bundles (500–2,000) ─────────────────────
  {
    name: "リスティングブースト 7日",
    nameEn: "Listing Boost 7-Day",
    nameTh: "Boost ประกาศ 7 วัน",
    description: "All your active listings stay boosted for 7 days",
    cost: 500,
    type: "CUSTOM",
    requiredLevel: 1,
    value: { reward: "listing_boost_weekly", days: 7 },
  },
  {
    name: "オートプライシング 7日",
    nameEn: "Auto-Pricing 7-Day Pass",
    nameTh: "ตั้งราคาอัตโนมัติ 7 วัน",
    description: "Unlock auto-pricing for all your listings for 7 days",
    cost: 800,
    type: "CUSTOM",
    requiredLevel: 1,
    value: { reward: "auto_pricing_pass", days: 7 },
  },
  {
    name: "LINE アラート 7日",
    nameEn: "LINE Alerts 7-Day Pass",
    nameTh: "แจ้งเตือนผ่าน LINE 7 วัน",
    description: "Receive price + market alerts on LINE for 7 days",
    cost: 800,
    type: "CUSTOM",
    requiredLevel: 1,
    value: { reward: "line_alerts_pass", days: 7 },
  },
  {
    name: "一括検索 +50",
    nameEn: "Bulk Lookup +50",
    nameTh: "ค้นหาราคาแบบกลุ่ม +50 ครั้ง",
    description: "Add 50 bulk price-lookup credits (one-shot)",
    cost: 600,
    type: "CUSTOM",
    requiredLevel: 1,
    value: { reward: "bulk_lookup_credit", quantity: 50 },
  },
  {
    name: "ミニクマ ペットスキン",
    nameEn: "Mini Kuma Pet Skin",
    nameTh: "สกินเพ็ต Mini Kuma",
    description: "A cosmetic Mini Kuma pet skin for your profile",
    cost: 1200,
    type: "PROFILE_FRAME",
    requiredLevel: 1,
    value: { frameId: "mini_kuma" },
  },

  // ── Tier L ─ Premium time-limited access (2,500–15,000) ─────────────
  {
    name: "Honey Pass — Pro 7日",
    nameEn: "Honey Pass — Pro (7 days)",
    nameTh: "Honey Pass — Pro (7 วัน)",
    description: "Pro features for 7 days + Honey Pro badge",
    cost: 2500,
    type: "TRIAL_PRO",
    requiredLevel: 2,
    value: { days: 7, badge: "Honey Pro", badgeTh: "Honey Pro" },
  },
  {
    name: "Honey Pass+ — Pro 30日",
    nameEn: "Honey Pass+ — Pro (30 days)",
    nameTh: "Honey Pass+ — Pro (30 วัน)",
    description: "Pro features for 30 days + Honey Elite badge + 1 free raffle ticket",
    cost: 8000,
    type: "TRIAL_PRO",
    requiredLevel: 2,
    value: { days: 30, badge: "Honey Elite", badgeTh: "Honey Elite", freeRaffleTickets: 1 },
  },
  {
    name: "Honey Pro+ Pass — Pro+ 30日",
    nameEn: "Honey Pro+ Pass — Pro+ (30 days)",
    nameTh: "Honey Pro+ Pass — Pro+ (30 วัน)",
    description: "Pro+ features for 30 days + Honey Pro+ badge + 2 free raffle tickets",
    cost: 15000,
    type: "TRIAL_PRO_PLUS",
    requiredLevel: 2,
    value: { days: 30, badge: "Honey Pro+", badgeTh: "Honey Pro+", freeRaffleTickets: 2 },
  },

  // ── Mega Pass ─ Capstone, requires Gold (lvl 3) ─────────────────────
  {
    name: "Mega Honey Pass — Pro 90日",
    nameEn: "Mega Honey Pass — Pro (90 days)",
    nameTh: "Mega Honey Pass — Pro (90 วัน)",
    description: "Pro features for 90 days + Mega badge + 3 raffle tickets + Flame frame",
    cost: 20000,
    type: "TRIAL_PRO",
    requiredLevel: 3,
    value: {
      days: 90,
      badge: "Honey Mega",
      badgeTh: "Honey Mega",
      freeRaffleTickets: 3,
      frameId: "flame",
    },
  },
];

/** Older catalog rows that should no longer be visible to new users. */
const DEACTIVATE_NAMES = [
  "Pro トライアル (1ヶ月)",
  "手数料割引 3%",
  "リスティングブースト",       // legacy 24h boost row, replaced by "リスティングブースト 24時間"
  "Pro (7日)",                  // legacy Tier-L Pro pass names
  "Pro (30日)",
  "Pro+ (30日)",
];

const RENAME_MAP: { oldName: string; newName: string; newNameEn: string; newNameTh: string; newDesc: string }[] = [
  // Past renames; kept here so older databases still converge to current names.
  { oldName: "Honey Pass (7日)", newName: "Honey Pass — Pro 7日", newNameEn: "Honey Pass — Pro (7 days)", newNameTh: "Honey Pass — Pro (7 วัน)", newDesc: "Pro features for 7 days + Honey Pro badge" },
  { oldName: "Honey Pass+ (30日)", newName: "Honey Pass+ — Pro 30日", newNameEn: "Honey Pass+ — Pro (30 days)", newNameTh: "Honey Pass+ — Pro (30 วัน)", newDesc: "Pro features for 30 days + Honey Elite badge + 1 free raffle ticket" },
  { oldName: "Honey Pro+ Pass (30日)", newName: "Honey Pro+ Pass — Pro+ 30日", newNameEn: "Honey Pro+ Pass — Pro+ (30 days)", newNameTh: "Honey Pro+ Pass — Pro+ (30 วัน)", newDesc: "Pro+ features for 30 days + Honey Pro+ badge + 2 free raffle tickets" },
];

async function main() {
  console.log("Seeding Honey Shop items...");

  for (const r of RENAME_MAP) {
    const item = await prisma.honeyShopItem.findFirst({ where: { name: r.oldName } });
    if (item) {
      await prisma.honeyShopItem.update({
        where: { id: item.id },
        data: { name: r.newName, nameEn: r.newNameEn, nameTh: r.newNameTh, description: r.newDesc },
      });
      console.log(`  [renamed] "${r.oldName}" -> "${r.newNameEn}"`);
    }
  }

  for (const name of DEACTIVATE_NAMES) {
    const item = await prisma.honeyShopItem.findFirst({ where: { name } });
    if (item && item.isActive) {
      await prisma.honeyShopItem.update({ where: { id: item.id }, data: { isActive: false } });
      console.log(`  [deactivated] "${item.nameEn ?? name}"`);
    }
  }

  for (const item of ITEMS) {
    const existing = await prisma.honeyShopItem.findFirst({ where: { name: item.name } });

    if (existing) {
      await prisma.honeyShopItem.update({
        where: { id: existing.id },
        data: {
          nameEn: item.nameEn,
          nameTh: item.nameTh,
          description: item.description,
          cost: item.cost,
          type: item.type,
          value: item.value as object,
          requiredLevel: item.requiredLevel ?? 0,
          isActive: true,
        },
      });
      console.log(`  [updated] "${item.nameEn}" (id: ${existing.id}, cost: ${existing.cost} -> ${item.cost}, lvl ${item.requiredLevel ?? 0})`);
      continue;
    }

    const created = await prisma.honeyShopItem.create({
      data: {
        name: item.name,
        nameEn: item.nameEn,
        nameTh: item.nameTh,
        description: item.description,
        cost: item.cost,
        type: item.type,
        value: item.value as object,
        requiredLevel: item.requiredLevel ?? 0,
        isActive: true,
        stock: null,
      },
    });
    console.log(`  [created] "${item.nameEn}" (id: ${created.id}, cost: ${created.cost}, lvl ${item.requiredLevel ?? 0})`);
  }

  console.log("Done!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

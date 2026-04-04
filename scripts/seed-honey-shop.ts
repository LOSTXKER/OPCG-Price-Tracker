import { prisma } from "./_db";
import type { ShopItemType } from "../src/generated/prisma/client";

const ITEMS: {
  name: string;
  nameEn: string;
  nameTh: string;
  description: string;
  cost: number;
  type: ShopItemType;
  value: Record<string, unknown>;
}[] = [
  {
    name: "Kuma バッジ",
    nameEn: "Kuma Profile Badge",
    nameTh: "แบดจ์ Kuma บนโปรไฟล์",
    description: "Exclusive Kuma badge on your profile",
    cost: 200,
    type: "BADGE",
    value: { imageUrl: null },
  },
  {
    name: "リスティングブースト",
    nameEn: "Free Listing Boost x1",
    nameTh: "Boost ฟรี 1 ครั้ง",
    description: "Boost your listing to the top for 24 hours",
    cost: 150,
    type: "CUSTOM",
    value: { reward: "listing_boost", hours: 24 },
  },
  {
    name: "ゴールドフレーム",
    nameEn: "Gold Profile Frame",
    nameTh: "กรอบโปรไฟล์สีทอง",
    description: "A shiny gold frame for your profile picture",
    cost: 100,
    type: "PROFILE_FRAME",
    value: { frameId: "gold" },
  },
  {
    name: "ダイヤモンドフレーム",
    nameEn: "Diamond Profile Frame",
    nameTh: "กรอบโปรไฟล์เพชร",
    description: "A premium diamond frame for your profile picture",
    cost: 200,
    type: "PROFILE_FRAME",
    value: { frameId: "diamond" },
  },
  {
    name: "炎フレーム",
    nameEn: "Flame Profile Frame",
    nameTh: "กรอบโปรไฟล์ไฟ",
    description: "A fiery frame for your profile picture",
    cost: 300,
    type: "PROFILE_FRAME",
    value: { frameId: "flame" },
  },
  {
    name: "アラート枠追加 +1",
    nameEn: "Price Alert +1 Slot",
    nameTh: "ช่องแจ้งเตือนราคา +1",
    description: "Add one extra price alert slot permanently",
    cost: 150,
    type: "PRICE_ALERT_SLOT",
    value: {},
  },
  {
    name: "CSV出力パス",
    nameEn: "CSV Export Pass",
    nameTh: "สิทธิ์ส่งออก CSV",
    description: "Export your portfolio to CSV once",
    cost: 200,
    type: "CSV_EXPORT_PASS",
    value: {},
  },
  // Pro / Pro+ packages (redeemable with Honey)
  {
    name: "Pro (7日)",
    nameEn: "Pro (7 days)",
    nameTh: "Pro (7 วัน)",
    description: "Pro features for 7 days + exclusive badge",
    cost: 2000,
    type: "TRIAL_PRO",
    value: { days: 7, badge: "Honey Pro", badgeTh: "Honey Pro" },
  },
  {
    name: "Pro (30日)",
    nameEn: "Pro (30 days)",
    nameTh: "Pro (30 วัน)",
    description: "Pro features for 30 days + Honey Elite badge + 1 free raffle ticket",
    cost: 5000,
    type: "TRIAL_PRO",
    value: { days: 30, badge: "Honey Elite", badgeTh: "Honey Elite", freeRaffleTickets: 1 },
  },
  {
    name: "Pro+ (30日)",
    nameEn: "Pro+ (30 days)",
    nameTh: "Pro+ (30 วัน)",
    description: "Pro+ features for 30 days + exclusive badge + 2 free raffle tickets",
    cost: 10000,
    type: "TRIAL_PRO_PLUS",
    value: { days: 30, badge: "Honey Pro+", badgeTh: "Honey Pro+", freeRaffleTickets: 2 },
  },
];

const DEACTIVATE_NAMES = [
  "Pro トライアル (1ヶ月)",
  "手数料割引 3%",
];

const RENAME_MAP: { oldName: string; newName: string; newNameEn: string; newNameTh: string; newDesc: string }[] = [
  { oldName: "Honey Pass (7日)", newName: "Pro (7日)", newNameEn: "Pro (7 days)", newNameTh: "Pro (7 วัน)", newDesc: "Pro features for 7 days + exclusive badge" },
  { oldName: "Honey Pass+ (30日)", newName: "Pro (30日)", newNameEn: "Pro (30 days)", newNameTh: "Pro (30 วัน)", newDesc: "Pro features for 30 days + Honey Elite badge + 1 free raffle ticket" },
  { oldName: "Honey Pro+ Pass (30日)", newName: "Pro+ (30日)", newNameEn: "Pro+ (30 days)", newNameTh: "Pro+ (30 วัน)", newDesc: "Pro+ features for 30 days + exclusive badge + 2 free raffle tickets" },
];

async function main() {
  console.log("Seeding Honey Shop items...");

  for (const name of DEACTIVATE_NAMES) {
    const item = await prisma.honeyShopItem.findFirst({ where: { name } });
    if (item && item.isActive) {
      await prisma.honeyShopItem.update({ where: { id: item.id }, data: { isActive: false } });
      console.log(`  [deactivated] "${item.nameEn ?? name}"`);
    }
  }

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

  // Update Price Alert Slot cost if it was 100
  const alertSlot = await prisma.honeyShopItem.findFirst({
    where: { name: "アラート枠追加 +1" },
  });
  if (alertSlot && alertSlot.cost === 100) {
    await prisma.honeyShopItem.update({ where: { id: alertSlot.id }, data: { cost: 150 } });
    console.log(`  [updated] "Price Alert +1 Slot" cost 100 -> 150`);
  }

  for (const item of ITEMS) {
    const existing = await prisma.honeyShopItem.findFirst({
      where: { name: item.name },
    });

    if (existing) {
      if (existing.cost !== item.cost || existing.description !== item.description) {
        await prisma.honeyShopItem.update({
          where: { id: existing.id },
          data: { cost: item.cost, description: item.description, nameEn: item.nameEn, nameTh: item.nameTh },
        });
        console.log(`  [updated] "${item.nameEn}" (id: ${existing.id}, cost: ${existing.cost} -> ${item.cost})`);
      } else {
        console.log(`  [skip] "${item.nameEn}" already exists (id: ${existing.id})`);
      }
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
        isActive: true,
        stock: null,
      },
    });
    console.log(`  [created] "${item.nameEn}" (id: ${created.id}, cost: ${created.cost})`);
  }

  console.log("Done!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

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
    name: "Pro トライアル (1ヶ月)",
    nameEn: "Pro Trial (1 month)",
    nameTh: "ทดลอง Pro (1 เดือน)",
    description: "Unlock Pro features for 30 days",
    cost: 500,
    type: "TRIAL_PRO",
    value: { days: 30 },
  },
  {
    name: "手数料割引 3%",
    nameEn: "Reduced Marketplace Fee (1 month)",
    nameTh: "ลดค่าธรรมเนียม Marketplace เหลือ 3% (1 เดือน)",
    description: "Marketplace fee reduced to 3% for 30 days",
    cost: 300,
    type: "CUSTOM",
    value: { reward: "fee_discount", feePercent: 3, days: 30 },
  },
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
    cost: 100,
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
];

async function main() {
  console.log("Seeding Honey Shop items...");

  for (const item of ITEMS) {
    const existing = await prisma.honeyShopItem.findFirst({
      where: { name: item.name },
    });

    if (existing) {
      console.log(`  [skip] "${item.nameEn}" already exists (id: ${existing.id})`);
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

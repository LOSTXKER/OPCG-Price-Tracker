import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as cheerio from "cheerio";

const cs = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!cs) throw new Error("DATABASE_URL or DIRECT_URL is not set");
const adapter = new PrismaPg({ connectionString: cs });
const prisma = new PrismaClient({ adapter });

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

const JP_TO_EN: Record<string, string> = {
  "ロロノア・ゾロ": "Roronoa Zoro",
  "モンキー・D・ルフィ": "Monkey.D.Luffy",
  "ポートガス・D・エース": "Portgas.D.Ace",
  "トラファルガー・ロー": "Trafalgar Law",
  "ウタ": "Uta",
  "ナミ": "Nami",
  "ニコ・ロビン": "Nico Robin",
  "サンジ": "Sanji",
  "シャンクス": "Shanks",
  "ヤマト": "Yamato",
  "ボア・ハンコック": "Boa Hancock",
  "ネフェルタリ・ビビ": "Nefeltari Vivi",
  "レベッカ": "Rebecca",
  "しらほし": "Shirahoshi",
  "カイドウ": "Kaido",
  "エドワード・ニューゲート": "Edward Newgate",
  "ドンキホーテ・ドフラミンゴ": "Donquixote Doflamingo",
  "クロコダイル": "Crocodile",
  "マーシャル・D・ティーチ": "Marshall.D.Teach",
  "キャロット": "Carrot",
  "ペローナ": "Perona",
  "エネル": "Enel",
  "フランキー": "Franky",
  "ブルック": "Brook",
  "チョッパー": "Chopper",
  "トニートニー・チョッパー": "Tony Tony Chopper",
  "ウソップ": "Usopp",
  "ジンベエ": "Jinbe",
  "ゴール・D・ロジャー": "Gol.D.Roger",
  "光月おでん": "Kozuki Oden",
};

function translateDonName(jpName: string): string {
  let charName = "";
  const charMatch = jpName.match(/ドン!!カード\(([^)]+)\)/);
  if (charMatch) {
    charName = charMatch[1];
  }

  let enChar = charName;
  for (const [jp, en] of Object.entries(JP_TO_EN)) {
    if (charName.includes(jp)) {
      enChar = en;
      break;
    }
  }

  const isParallel = jpName.includes("パラレル");
  const isSuper = jpName.includes("スーパーパラレル");

  let suffix = "";
  if (isSuper) suffix = " (Parallel)(Super Parallel)";
  else if (isParallel) suffix = " (Parallel)";

  if (charName) {
    return `DON!! Card (${enChar})${suffix}`;
  }

  // No character name, try to use the full text
  return `DON!! Card${suffix}`;
}

async function fetchYuyuteiImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);
    const img = $(".card-detail-img img, .card_image img, .product-img img.card").first().attr("src");
    if (img && img.startsWith("http")) return img;
    if (img && img.startsWith("/")) return `https://yuyu-tei.jp${img}`;
    return null;
  } catch {
    return null;
  }
}

async function main() {
  console.log("=== Fixing DON!! card images and names ===\n");

  const donCards = await prisma.card.findMany({
    where: { rarity: "DON" },
    select: {
      id: true,
      cardCode: true,
      nameJp: true,
      nameEn: true,
      imageUrl: true,
      yuyuteiUrl: true,
      yuyuteiId: true,
      set: { select: { code: true } },
    },
  });

  console.log(`Found ${donCards.length} DON!! cards\n`);

  let imgFixed = 0;
  let nameFixed = 0;

  for (const card of donCards) {
    const updates: Record<string, string> = {};

    // Fix nameEn
    if (!card.nameEn) {
      const enName = translateDonName(card.nameJp);
      updates.nameEn = enName;
      nameFixed++;
    }

    // Fix imageUrl — fetch from Yuyu-tei if current URL is broken
    if (
      card.imageUrl?.includes("/-_p") ||
      card.imageUrl?.includes("/-. ") ||
      !card.imageUrl
    ) {
      if (card.yuyuteiUrl) {
        const yuyuteiImg = await fetchYuyuteiImage(card.yuyuteiUrl);
        if (yuyuteiImg) {
          updates.imageUrl = yuyuteiImg;
          imgFixed++;
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      await prisma.card.update({
        where: { id: card.id },
        data: updates,
      });
      console.log(
        `[${card.set.code}] ${card.cardCode}: ${updates.nameEn ? `name="${updates.nameEn}"` : ""} ${updates.imageUrl ? `img=✓` : ""}`
      );
    }

    // Rate limit
    if (updates.imageUrl) await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\n✅ Done: ${imgFixed} images fixed, ${nameFixed} names fixed`);
  await prisma.$disconnect();
}

main().catch(console.error);

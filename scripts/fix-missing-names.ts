import "dotenv/config";
import pg from "pg";

const cs = process.env.DATABASE_URL;
if (!cs) throw new Error("DATABASE_URL is not set");
const pool = new pg.Pool({
  connectionString: cs + (cs.includes("?") ? "&" : "?") + "pgbouncer=true",
  max: 2,
});

const OPTCG_API = "https://optcgapi.com/api/sets/card";
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
  "トニートニー・チョッパー": "Tony Tony Chopper",
  "チョッパー": "Chopper",
  "ウソップ": "Usopp",
  "ジンベエ": "Jinbe",
  "ゴール・D・ロジャー": "Gol.D.Roger",
  "光月おでん": "Kozuki Oden",
  "シャーロット・カタクリ": "Charlotte Katakuri",
  "シャーロット・リンリン": "Charlotte Linlin",
  "ユースタス・キッド": "Eustass Kid",
  "キング": "King",
  "クイーン": "Queen",
  "ロブ・ルッチ": "Rob Lucci",
  "マゼラン": "Magellan",
  "ゲッコー・モリア": "Gecko Moria",
  "サボ": "Sabo",
  "サカズキ": "Sakazuki",
  "ヴィンスモーク・レイジュ": "Vinsmoke Reiju",
  "ドンキホーテ・ロシナンテ": "Donquixote Rosinante",
  "ホーディ・ジョーンズ": "Hody Jones",
  "アイスバーグ": "Iceburg",
  "エンポリオ・イワンコフ": "Emporio Ivankov",
  "ギン": "Gin",
  "クリーク": "Krieg",
  "バーソロミュー・くま": "Bartholomew Kuma",
  "ジュラキュール・ミホーク": "Dracule Mihawk",
  "バギー": "Buggy",
  "アーロン": "Arlong",
  "クロ": "Kuro",
  "ベラミー": "Bellamy",
  "ワイパー": "Wyper",
  "ヴィンスモーク・ジャッジ": "Vinsmoke Judge",
  "カタクリ": "Katakuri",
  "スモーカー": "Smoker",
  "たしぎ": "Tashigi",
  "ヒナ": "Hina",
  "コビー": "Coby",
  "Mr.2・ボン・クレー": "Mr.2 Bon Clay",
  "白ひげ": "Whitebeard",
  "おでん": "Oden",
  "ベン・ベックマン": "Benn Beckman",
  "ルッチ": "Lucci",
  "ドフラミンゴ": "Doflamingo",
  "ティーチ": "Teach",
  "ニューゲート": "Newgate",
  "ハンコック": "Hancock",
  "ミホーク": "Mihawk",
  "イワンコフ": "Ivankov",
  "ビビ": "Vivi",
  "ロジャー": "Roger",
  "ゾロ": "Zoro",
  "ルフィ": "Luffy",
  "エース": "Ace",
  "ロー": "Law",
};

function translateCharName(jpName: string): string | null {
  const cleanName = jpName.replace(/\(パラレル\)/g, "").replace(/\(スーパーパラレル\)/g, "").replace(/\(PRB\)/g, "").replace(/\(海賊旗フォイル\)/g, "").trim();
  
  for (const [jp, en] of Object.entries(JP_TO_EN)) {
    if (cleanName === jp || cleanName.startsWith(jp)) {
      return en;
    }
  }
  return null;
}

interface OptcgCard {
  card_name: string;
  card_image_id: string;
  card_color: string;
  card_type: string;
  card_cost: string | null;
  card_power: string | null;
  card_counter: string | null;
  card_life: string | null;
  card_attribute: string | null;
  card_effect: string | null;
  card_trigger: string | null;
  card_traits: string | null;
}

async function fetchOptcgSet(setCode: string): Promise<OptcgCard[]> {
  const url = `${OPTCG_API}?id=${setCode.toUpperCase()}-`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function main() {
  console.log("=== Fixing missing nameEn for non-DON cards ===\n");

  const { rows: noEnCards } = await pool.query(`
    SELECT c.id, c."cardCode", c."nameJp", c."nameEn", c."baseCode", c.rarity, c."isParallel",
           c."effectEn", c."colorEn", c."cardType",
           s.code as "setCode"
    FROM "Card" c
    JOIN "CardSet" s ON c."setId" = s.id
    WHERE c."nameEn" IS NULL AND c.rarity != 'DON'
    ORDER BY s.code, c."cardCode"
  `);

  console.log(`Found ${noEnCards.length} non-DON cards without nameEn\n`);

  // Group by set
  const bySet = new Map<string, typeof noEnCards>();
  for (const card of noEnCards) {
    if (!bySet.has(card.setCode)) bySet.set(card.setCode, []);
    bySet.get(card.setCode)!.push(card);
  }

  let fixed = 0;

  for (const [setCode, cards] of bySet) {
    console.log(`\n--- ${setCode.toUpperCase()} (${cards.length} cards) ---`);

    // Try OPTCG API first
    const optcgCards = await fetchOptcgSet(setCode);
    await new Promise((r) => setTimeout(r, 500));

    for (const card of cards) {
      const updates: string[] = [];
      const values: unknown[] = [];
      let paramIdx = 1;

      // Try matching by baseCode in OPTCG API
      if (card.baseCode && card.baseCode !== "-") {
        const match = optcgCards.find(
          (o) => o.card_image_id === card.baseCode ||
                 o.card_image_id === `${card.baseCode}_p${card.parallelIndex ?? 1}`
        );

        if (match) {
          updates.push(`"nameEn" = $${paramIdx++}`);
          values.push(match.card_name);

          if (!card.effectEn && match.card_effect) {
            updates.push(`"effectEn" = $${paramIdx++}`);
            values.push(match.card_effect);
          }
          if (!card.colorEn && match.card_color) {
            updates.push(`"colorEn" = $${paramIdx++}`);
            values.push(match.card_color);
          }
          if (!card.cardType && match.card_type) {
            updates.push(`"cardType" = $${paramIdx++}`);
            values.push(match.card_type);
          }
        }
      }

      // If no OPTCG match, try JP-to-EN dictionary
      if (updates.length === 0) {
        const enName = translateCharName(card.nameJp);
        if (enName) {
          updates.push(`"nameEn" = $${paramIdx++}`);
          values.push(enName);
        }
      }

      if (updates.length > 0) {
        values.push(card.id);
        await pool.query(
          `UPDATE "Card" SET ${updates.join(", ")} WHERE id = $${paramIdx}`,
          values
        );
        fixed++;
        const name = values[0] as string;
        console.log(`  ✓ ${card.baseCode ?? card.cardCode}: "${name}"`);
      } else {
        console.log(`  ✗ ${card.cardCode}: no match (${card.nameJp})`);
      }
    }
  }

  console.log(`\n✅ Done: ${fixed}/${noEnCards.length} cards fixed`);
  await pool.end();
}

main().catch(console.error);

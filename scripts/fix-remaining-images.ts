import "dotenv/config";
import pg from "pg";

const cs = process.env.DATABASE_URL;
if (!cs) throw new Error("DATABASE_URL is not set");
const pool = new pg.Pool({
  connectionString: cs + (cs.includes("?") ? "&" : "?") + "pgbouncer=true",
  max: 2,
});

const YUYU_IMG = "https://card.yuyu-tei.jp/opc/front";

async function checkUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    return res.ok;
  } catch {
    return false;
  }
}

async function main() {
  console.log("=== Fixing remaining broken images ===\n");

  // Find all cards with broken Bandai images
  const { rows: cards } = await pool.query(`
    SELECT c.id, c."cardCode", c."nameEn", c."imageUrl", c."yuyuteiId",
           c."baseCode", c.rarity, s.code as "setCode"
    FROM "Card" c
    JOIN "CardSet" s ON c."setId" = s.id
    WHERE c."imageUrl" LIKE '%onepiece-cardgame.com%'
    ORDER BY s.code, c."cardCode"
  `);

  let broken = 0;
  let fixed = 0;

  for (const card of cards) {
    const ok = await checkUrl(card.imageUrl);
    if (ok) continue;

    broken++;
    console.log(`\n✗ [${card.setCode}] ${card.nameEn} | ${card.imageUrl}`);

    // Strategy 1: Try Yuyu-tei with current setCode
    if (card.yuyuteiId) {
      const url1 = `${YUYU_IMG}/${card.setCode}/${card.yuyuteiId}.jpg`;
      if (await checkUrl(url1)) {
        await pool.query(`UPDATE "Card" SET "imageUrl" = $1 WHERE id = $2`, [url1, card.id]);
        fixed++;
        console.log(`  → Fixed (own set): ${url1}`);
        continue;
      }

      // Strategy 2: Search across all known set folders on Yuyu-tei
      const setsToTry = [
        "op01","op02","op03","op04","op05","op06","op07","op08","op09","op10",
        "op11","op12","op13","op14","op15",
        "eb01","eb02","eb03","eb04",
        "st01","st02","st03","st04","st05","st06","st07","st08","st09","st10",
        "st11","st12","st13","st14","st15","st16","st17","st18","st19","st20","st21",
        "prb01",
      ];

      let found = false;
      for (const set of setsToTry) {
        if (set === card.setCode) continue;
        const url2 = `${YUYU_IMG}/${set}/${card.yuyuteiId}.jpg`;
        if (await checkUrl(url2)) {
          await pool.query(`UPDATE "Card" SET "imageUrl" = $1 WHERE id = $2`, [url2, card.id]);
          fixed++;
          found = true;
          console.log(`  → Fixed (cross-set ${set}): ${url2}`);
          break;
        }
      }
      if (found) continue;
    }

    // Strategy 3: Try different parallel indices on Bandai
    if (card.baseCode && card.baseCode !== "-") {
      const bandaiBase = "https://asia-en.onepiece-cardgame.com/images/cardlist/card";
      for (const pIdx of [1, 2, 3, 5, 6]) {
        const url3 = `${bandaiBase}/${card.baseCode}_p${pIdx}.png`;
        if (await checkUrl(url3)) {
          await pool.query(`UPDATE "Card" SET "imageUrl" = $1 WHERE id = $2`, [url3, card.id]);
          fixed++;
          console.log(`  → Fixed (Bandai p${pIdx}): ${url3}`);
          break;
        }
      }
    }
  }

  console.log(`\n✅ Done: ${broken} broken, ${fixed} fixed`);
  await pool.end();
}

main().catch(console.error);
